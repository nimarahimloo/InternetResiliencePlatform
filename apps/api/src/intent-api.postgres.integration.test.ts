import Fastify from 'fastify';
import { createCanonicalRuntime } from '@irp/resilience-runtime';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPrismaClient } from '@irp/database';
import {
  DatabaseIntentStore,
  registerIntentRoutes,
  type ArbitrationConflict,
  type IntentOwnership,
} from './intent-api.js';
import { createOwnerScopedIntentActivator } from './intent-runtime-handoff.js';

// Set DATABASE_URL to a disposable PostgreSQL database to exercise the real
// SQL path. The max-one connection keeps temporary tables alive for this test.
const postgresDescribe = describe.skipIf(!process.env.DATABASE_URL);

postgresDescribe('PostgreSQL conflict journal integration', () => {
  const ownerA: IntentOwnership = { principalId: 'pg-principal-a' };
  const ownerB: IntentOwnership = { principalId: 'pg-principal-b' };
  let client: ReturnType<typeof createPrismaClient>;

  beforeAll(async () => {
    client = createPrismaClient(process.env.DATABASE_URL, { max: 1 });
    await client.$queryRaw`CREATE TEMP TABLE "IntentConflictRecord" (
      "id" TEXT PRIMARY KEY,
      "intentAId" TEXT NOT NULL,
      "intentBId" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "resolution" TEXT NOT NULL,
      "ownerScopeKey" TEXT NOT NULL,
      "recordedAt" TIMESTAMPTZ NOT NULL
    )`;
    await client.$queryRaw`CREATE TEMP TABLE "NetworkIntentRecord" (
      "id" VARCHAR(128) PRIMARY KEY,
      "version" INTEGER NOT NULL,
      "status" VARCHAR(32) NOT NULL,
      "priority" VARCHAR(16) NOT NULL,
      "spec" JSONB NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL,
      "effectiveFrom" TIMESTAMPTZ,
      "expiresAt" TIMESTAMPTZ,
      "supersedes" VARCHAR(128),
      "metadata" JSONB NOT NULL DEFAULT '{}',
      "provenance" VARCHAR(512),
      "confidence" DOUBLE PRECISION,
      "autonomy" VARCHAR(40),
      "ownerPrincipalId" VARCHAR(255) NOT NULL,
      "organizationId" VARCHAR(128),
      "ownerScopeKey" VARCHAR(384) NOT NULL,
      "idempotencyKey" VARCHAR(128),
      "idempotencyFingerprint" VARCHAR(64)
    )`;
    await client.$queryRaw`CREATE UNIQUE INDEX "NetworkIntentRecord_ownerScopeKey_idempotencyKey_key"
      ON "NetworkIntentRecord" ("ownerScopeKey", "idempotencyKey")`;
  });

  afterAll(async () => {
    await client.$disconnect();
  });

  it('persists an API intent in PostgreSQL, reloads it under its owner, and runs the reloaded intent through ResilienceRuntime via owner-scoped handoff', async () => {
    const ownerA: IntentOwnership = { principalId: 'pg-intent-owner-a' };
    const ownerB: IntentOwnership = { principalId: 'pg-intent-owner-b' };
    const runtime = createCanonicalRuntime({
      executionMode: 'simulation',
      runtimeId: 'postgres-intent-integration',
    }).runtime;
    const activationRecords: Awaited<ReturnType<typeof runtime.runIntents>>[] = [];
    const app = Fastify();
    const id = `pg-intent-${Date.now()}`;
    const key = `pg-idempotency-${id}`;
    const effectiveFrom = new Date(Date.now() - 60_000).toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

    const store = new DatabaseIntentStore(client);
    const activator = createOwnerScopedIntentActivator({
      store,
      runtime,
    });

    registerIntentRoutes(app, {
      database: client,
      requirePermission: async () => ({
        id: ownerA.principalId,
        roles: ['admin'],
        scopes: ['*'],
      }),
      onActivated: async (intent, ownership) => {
        activationRecords.push(await activator(intent, ownership));
      },
    });

    try {
      const created = await app.inject({
        method: 'POST',
        url: '/api/v1/intents',
        headers: { 'idempotency-key': key },
        payload: {
          id,
          priority: 'high',
          spec: {
            outcome: 'Maintain stable connectivity',
            target: { destination: 'example.com' },
          },
          effectiveFrom,
          expiresAt,
          provenance: 'postgres-intent-runtime-integration',
          autonomy: 'OBSERVE_ONLY',
        },
      });
      expect(created.statusCode).toBe(201);

      const activated = await app.inject({
        method: 'POST',
        url: `/api/v1/intents/${id}/commands`,
        payload: { type: 'activate' },
      });
      expect(activated.statusCode).toBe(200);
      expect(activated.json().data).toMatchObject({ id, status: 'active', version: 2 });
      expect(activationRecords).toHaveLength(1);
      expect(
        activationRecords[0]!.runtimeContext.compiledIntents?.some(
          (intent) => intent.intentId === id && intent.version === 2,
        ),
      ).toBe(true);
    } finally {
      await app.close();
    }

    // This is a distinct store instance with no API-store in-memory state.
    const reader = new DatabaseIntentStore(client);
    const reloaded = await reader.get(id, ownerA);
    expect(reloaded).toMatchObject({
      id,
      status: 'active',
      version: 2,
      provenance: 'postgres-intent-runtime-integration',
    });
    expect(await reader.get(id, ownerB)).toBeUndefined();
    expect((await reader.findByIdempotency(ownerA, key))?.intent.id).toBe(id);
    expect(await reader.findByIdempotency(ownerB, key)).toBeUndefined();

    // Exercise the exact persisted/reloaded object through the canonical runtime,
    // rather than treating a mock or an in-memory round-trip as persistence proof.
    const replayedDecision = await runtime.runIntent(reloaded!, {
      mode: 'simulation',
      correlationId: `pg-intent-reloaded-${id}`,
      idempotencyKey: `pg-intent-reloaded-${id}`,
    });
    expect(
      replayedDecision.runtimeContext.compiledIntents?.some(
        (intent) =>
          intent.intentId === id &&
          intent.version === 2 &&
          intent.provenance === 'postgres-intent-runtime-integration',
      ),
    ).toBe(true);
  });

  it('fails closed on an expired active intent loaded from PostgreSQL', async () => {
    const ownerA: IntentOwnership = { principalId: 'pg-stale-owner' };
    const runtime = createCanonicalRuntime({
      executionMode: 'simulation',
      runtimeId: 'postgres-stale-intent',
    }).runtime;
    const store = new DatabaseIntentStore(client);
    const activator = createOwnerScopedIntentActivator({ store, runtime });

    const id = `pg-stale-${Date.now()}`;
    const expiredAt = new Date(Date.now() - 60_000).toISOString();
    // Insert a row that is status=active but already past expiresAt.
    await client.$queryRaw`INSERT INTO "NetworkIntentRecord" (
      "id", "version", "status", "priority", "spec", "createdAt", "updatedAt",
      "expiresAt", "ownerPrincipalId", "ownerScopeKey"
    ) VALUES (
      ${id}, 2, 'active', 'normal', '{"outcome":"stale"}'::jsonb,
      NOW(), NOW(), ${expiredAt}, ${ownerA.principalId}, ${'principal:' + ownerA.principalId}
    )`;

    const loaded = await store.get(id, ownerA);
    expect(loaded).toBeDefined();
    expect(loaded!.status).toBe('active');
    expect(loaded!.expiresAt).toBe(expiredAt);

    await expect(activator(loaded!, ownerA)).rejects.toThrow(
      'not present in the effective owner-scoped store',
    );
  });

  it('persists conflicts across store instances without crossing owner scopes', async () => {
    const timestamp = new Date().toISOString();
    const conflict: ArbitrationConflict = {
      intentA: { intentId: 'pg-a', desiredOutcome: 'primary', priority: 'high', version: 1 },
      intentB: { intentId: 'pg-b', desiredOutcome: 'secondary', priority: 'normal', version: 1 },
      reason: 'same target conflict',
      resolution: 'supersede-a',
      timestamp,
    };

    const writer = new DatabaseIntentStore(client);
    await writer.recordConflict(conflict, ownerA);
    // The same logical conflict under another owner must get a distinct row ID.
    await writer.recordConflict(conflict, ownerB);

    // A new store has no in-memory mirror; reads must come from PostgreSQL.
    const reader = new DatabaseIntentStore(client);
    const fromA = await reader.listConflicts(ownerA, 10);
    const fromB = await reader.listConflicts(ownerB, 10);

    expect(fromA).toHaveLength(1);
    expect(fromA[0]).toMatchObject({
      intentA: { intentId: 'pg-a' },
      intentB: { intentId: 'pg-b' },
      reason: 'same target conflict',
    });
    expect(fromB).toHaveLength(1);
    expect(fromB[0]).toMatchObject({ reason: 'same target conflict' });
  });
});
