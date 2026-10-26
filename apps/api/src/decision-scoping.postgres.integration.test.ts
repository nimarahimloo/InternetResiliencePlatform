import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPrismaClient } from '@irp/database';
import { buildServer } from './index.js';

// Set DATABASE_URL to a disposable PostgreSQL database with the
// RuntimeDecisionRecord migration applied to exercise the durable path.
const postgresDescribe = describe.skipIf(!process.env.DATABASE_URL);

const register = async (
  app: Awaited<ReturnType<typeof buildServer>>,
  email: string,
): Promise<string> => {
  const created = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email, name: 'Scope Test', password: 'Production12345' },
  });
  expect(created.statusCode).toBe(201);
  const login = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password: 'Production12345' },
  });
  expect(login.statusCode).toBe(200);
  return login.json().data.accessToken as string;
};

postgresDescribe('owner-scoped runtime decision surfaces (PostgreSQL)', () => {
  let client: ReturnType<typeof createPrismaClient>;
  const suffix = Date.now();
  const emailA = `scope-a-${suffix}@example.com`;
  const emailB = `scope-b-${suffix}@example.com`;

  beforeAll(async () => {
    client = createPrismaClient(process.env.DATABASE_URL, { max: 2 });
    // Apply the real migration when the table is missing (CI provisions an empty
    // database), so the shipped SQL is what this test runs against.
    const exists =
      (await client.$queryRaw`SELECT to_regclass('"RuntimeDecisionRecord"') AS name`) as {
        name: string | null;
      }[];
    if (!exists[0]?.name) {
      const migration = readFileSync(
        new URL(
          '../../../packages/database/prisma/migrations/20261021000000_phase_274_runtime_decisions/migration.sql',
          import.meta.url,
        ),
        'utf8',
      );
      for (const statement of migration
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)) {
        await client.$queryRaw(
          Object.assign([statement], { raw: [statement] }) as TemplateStringsArray,
        );
      }
    }
    process.env.IRP_BOOTSTRAP_ADMIN_EMAILS = `${emailA},${emailB}`;
  });

  afterAll(async () => {
    delete process.env.IRP_BOOTSTRAP_ADMIN_EMAILS;
    await client.$disconnect();
  });

  it('lets a caller see the autopilot run it created, and never another owner’s decisions', async () => {
    const app = await buildServer();
    try {
      const tokenA = await register(app, emailA);
      const tokenB = await register(app, emailB);
      const headersA = { authorization: `Bearer ${tokenA}` };
      const headersB = { authorization: `Bearer ${tokenB}` };

      const run = await app.inject({
        method: 'POST',
        url: '/api/v1/autopilot/runs',
        headers: headersA,
        payload: { dryRun: false, shadow: false },
      });
      expect(run.statusCode).toBe(200);
      const decisionId = run.json().data.decisionId as string;

      // The creator must be able to list and fetch the run it just started.
      const listA = await app.inject({
        method: 'GET',
        url: '/api/v1/autopilot/runs',
        headers: headersA,
      });
      expect(listA.json().data.map((d: { decisionId: string }) => d.decisionId)).toContain(
        decisionId,
      );
      const getA = await app.inject({
        method: 'GET',
        url: `/api/v1/autopilot/runs/${decisionId}`,
        headers: headersA,
      });
      expect(getA.statusCode).toBe(200);

      // Every decision surface must hide that run from a different owner.
      const listB = await app.inject({
        method: 'GET',
        url: '/api/v1/autopilot/runs',
        headers: headersB,
      });
      expect(listB.json().data.map((d: { decisionId: string }) => d.decisionId)).not.toContain(
        decisionId,
      );
      const getB = await app.inject({
        method: 'GET',
        url: `/api/v1/autopilot/runs/${decisionId}`,
        headers: headersB,
      });
      expect(getB.statusCode).toBe(404);

      const runtimeListB = await app.inject({
        method: 'GET',
        url: '/api/v1/runtime/decisions',
        headers: headersB,
      });
      expect(
        runtimeListB.json().data.map((d: { decisionId: string }) => d.decisionId),
      ).not.toContain(decisionId);

      const explainB = await app.inject({
        method: 'GET',
        url: `/api/v1/runtime/decisions/${decisionId}/explanation`,
        headers: headersB,
      });
      expect(explainB.statusCode).toBe(404);

      const explainA = await app.inject({
        method: 'GET',
        url: `/api/v1/runtime/decisions/${decisionId}/explanation`,
        headers: headersA,
      });
      expect(explainA.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  }, 30000);
});
