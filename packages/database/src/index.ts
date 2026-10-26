import { Pool } from 'pg';

export type DatabaseClient = {
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  $disconnect(): Promise<void>;
};

const createMemoryDatabaseClient = (): DatabaseClient => ({
  async $queryRaw(): Promise<unknown> {
    return [{ ok: 1 }];
  },
  async $disconnect(): Promise<void> {
    return undefined;
  },
});

export type IdleClientErrorHandler = (error: Error) => void;

/**
 * Default handler for errors emitted by idle pooled clients. node-postgres
 * emits 'error' on the pool when an idle client loses its connection (for
 * example a PostgreSQL restart, failover or `pg_terminate_backend`). Without a
 * listener Node treats it as an unhandled 'error' event and terminates the
 * process, turning a recoverable database outage into an API crash. The pool
 * discards the broken client and the next query reconnects; in-flight and
 * subsequent queries still reject, so readiness checks report the outage.
 */
export const reportIdleClientError: IdleClientErrorHandler = (error) => {
  process.stderr.write(
    `${JSON.stringify({ level: 'warn', msg: 'database idle client error', error: error.message })}\n`,
  );
};

export interface DatabaseClientOptions {
  onIdleClientError?: IdleClientErrorHandler;
  max?: number;
}

export const createPrismaClient = (
  databaseUrl = process.env.DATABASE_URL,
  options: DatabaseClientOptions = {},
): DatabaseClient => {
  if (!databaseUrl) return createMemoryDatabaseClient();
  const pool = new Pool({ connectionString: databaseUrl, max: options.max ?? 5 });
  pool.on('error', options.onIdleClientError ?? reportIdleClientError);
  return {
    async $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown> {
      const text = strings.reduce(
        (sql, part, index) => `${sql}${part}${index < values.length ? `$${index + 1}` : ''}`,
        '',
      );
      const result = await pool.query(text, values);
      return result.rows;
    },
    async $disconnect(): Promise<void> {
      await pool.end();
    },
  };
};
export const createGeneratedPrismaClient = async (
  databaseUrl = process.env.DATABASE_URL,
  options: DatabaseClientOptions = {},
): Promise<DatabaseClient> => createPrismaClient(databaseUrl, options);
export interface DatabaseHealth {
  ok: boolean;
  latencyMs: number;
}
export const checkDatabaseHealth = async (
  client: Pick<DatabaseClient, '$queryRaw'>,
): Promise<DatabaseHealth> => {
  const started = performance.now();
  await client.$queryRaw`SELECT 1`;
  return { ok: true, latencyMs: Math.round(performance.now() - started) };
};

export interface IntentRecordRow {
  id: string;
  version: number;
  status: string;
  priority: string;
  spec: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
  effectiveFrom?: Date | string | null;
  expiresAt?: Date | string | null;
  supersedes?: string | null;
  metadata: unknown;
  provenance?: string | null;
  confidence?: number | null;
  autonomy?: string | null;
  ownerPrincipalId: string;
  organizationId?: string | null;
  ownerScopeKey: string;
  idempotencyKey?: string | null;
  idempotencyFingerprint?: string | null;
}

const jsonValue = (value: unknown): string => JSON.stringify(value ?? {});

export class IntentRepositoryConflictError extends Error {
  readonly code = 'INTENT_REPOSITORY_CONFLICT';
  constructor(message = 'Intent repository conflict') {
    super(message);
    this.name = 'IntentRepositoryConflictError';
  }
}

export interface IntentConflictRow {
  id: string;
  intentAId: string;
  intentBId: string;
  reason: string;
  resolution: string;
  ownerScopeKey: string;
  recordedAt: Date | string;
}

export interface IntentRepository {
  get(id: string, ownerScopeKey: string): Promise<IntentRecordRow | undefined>;
  list(
    status: string | undefined,
    ownerScopeKey: string,
    limit?: number,
  ): Promise<readonly IntentRecordRow[]>;
  put(row: IntentRecordRow, expectedVersion?: number): Promise<void>;
  findByIdempotency(ownerScopeKey: string, key: string): Promise<IntentRecordRow | undefined>;
  recordConflict(row: IntentConflictRow): Promise<void>;
  listConflicts(
    ownerScopeKey: string,
    limit?: number,
    since?: Date | string,
  ): Promise<readonly IntentConflictRow[]>;
  getConflict(id: string, ownerScopeKey: string): Promise<IntentConflictRow | undefined>;
}

export const createIntentRepository = (
  client: Pick<DatabaseClient, '$queryRaw'>,
): IntentRepository => ({
  async get(id, ownerScopeKey) {
    const rows =
      await client.$queryRaw`SELECT * FROM "NetworkIntentRecord" WHERE "id" = ${id} AND "ownerScopeKey" = ${ownerScopeKey} LIMIT 1`;
    return (rows as IntentRecordRow[])[0];
  },
  async list(status, ownerScopeKey, limit = 100) {
    // The public Intent API limits client listings to 100. Internal runtime
    // arbitration may request 101 to detect overflow and fail closed instead
    // of silently arbitrating only a truncated 100-row subset.
    const bounded = Math.min(101, Math.max(1, limit));
    if (status)
      return (await client.$queryRaw`SELECT * FROM "NetworkIntentRecord" WHERE "ownerScopeKey" = ${ownerScopeKey} AND "status" = ${status} ORDER BY "updatedAt" DESC LIMIT ${bounded}`) as IntentRecordRow[];
    return (await client.$queryRaw`SELECT * FROM "NetworkIntentRecord" WHERE "ownerScopeKey" = ${ownerScopeKey} ORDER BY "updatedAt" DESC LIMIT ${bounded}`) as IntentRecordRow[];
  },
  async put(row, expectedVersion) {
    if (expectedVersion === undefined) {
      const inserted =
        await client.$queryRaw`INSERT INTO "NetworkIntentRecord" ("id","version","status","priority","spec","createdAt","updatedAt","effectiveFrom","expiresAt","supersedes","metadata","provenance","confidence","autonomy","ownerPrincipalId","organizationId","ownerScopeKey","idempotencyKey","idempotencyFingerprint") VALUES (${row.id},${row.version},${row.status},${row.priority},${jsonValue(row.spec)}::jsonb,${row.createdAt},${row.updatedAt},${row.effectiveFrom ?? null},${row.expiresAt ?? null},${row.supersedes ?? null},${jsonValue(row.metadata)}::jsonb,${row.provenance ?? null},${row.confidence ?? null},${row.autonomy ?? null},${row.ownerPrincipalId},${row.organizationId ?? null},${row.ownerScopeKey},${row.idempotencyKey ?? null},${row.idempotencyFingerprint ?? null}) ON CONFLICT DO NOTHING RETURNING "id"`;
      if (!Array.isArray(inserted) || inserted.length === 0)
        throw new IntentRepositoryConflictError('Intent id or idempotency key is already in use.');
      return;
    }
    const updated =
      await client.$queryRaw`UPDATE "NetworkIntentRecord" SET "version"=${row.version},"status"=${row.status},"priority"=${row.priority},"spec"=${jsonValue(row.spec)}::jsonb,"updatedAt"=${row.updatedAt},"effectiveFrom"=${row.effectiveFrom ?? null},"expiresAt"=${row.expiresAt ?? null},"supersedes"=${row.supersedes ?? null},"metadata"=${jsonValue(row.metadata)}::jsonb,"provenance"=${row.provenance ?? null},"confidence"=${row.confidence ?? null},"autonomy"=${row.autonomy ?? null} WHERE "id"=${row.id} AND "ownerScopeKey"=${row.ownerScopeKey} AND "version"=${expectedVersion} RETURNING "id"`;
    if (!Array.isArray(updated) || updated.length === 0)
      throw new IntentRepositoryConflictError('Intent version or ownership conflict.');
  },
  async findByIdempotency(ownerScopeKey, key) {
    const rows =
      await client.$queryRaw`SELECT * FROM "NetworkIntentRecord" WHERE "ownerScopeKey" = ${ownerScopeKey} AND "idempotencyKey" = ${key} LIMIT 1`;
    return (rows as IntentRecordRow[])[0];
  },
  async recordConflict(row) {
    await client.$queryRaw`INSERT INTO "IntentConflictRecord" ("id","intentAId","intentBId","reason","resolution","ownerScopeKey","recordedAt") VALUES (${row.id},${row.intentAId},${row.intentBId},${row.reason},${row.resolution},${row.ownerScopeKey},${row.recordedAt}) ON CONFLICT ("id") DO NOTHING`;
  },
  async listConflicts(ownerScopeKey, limit = 100, since?) {
    const bounded = Math.min(100, Math.max(1, limit));
    if (since)
      return (await client.$queryRaw`SELECT * FROM "IntentConflictRecord" WHERE "ownerScopeKey" = ${ownerScopeKey} AND "recordedAt" > ${since} ORDER BY "recordedAt" DESC LIMIT ${bounded}`) as IntentConflictRow[];
    return (await client.$queryRaw`SELECT * FROM "IntentConflictRecord" WHERE "ownerScopeKey" = ${ownerScopeKey} ORDER BY "recordedAt" DESC LIMIT ${bounded}`) as IntentConflictRow[];
  },
  async getConflict(id, ownerScopeKey) {
    const rows =
      await client.$queryRaw`SELECT * FROM "IntentConflictRecord" WHERE "id" = ${id} AND "ownerScopeKey" = ${ownerScopeKey} LIMIT 1`;
    return (rows as IntentConflictRow[])[0];
  },
});

export interface RuntimeDecisionRow {
  decisionId: string;
  runtimeId: string;
  correlationId: string;
  outcome: string;
  /** Full canonical DecisionRecord, stored as JSON. */
  record: unknown;
  /** Set only when a decision was produced for an owner-scoped intent handoff. */
  ownerScopeKey?: string | null;
  recordedAt: Date | string;
}

export interface RuntimeDecisionRepository {
  put(row: RuntimeDecisionRow): Promise<void>;
  get(decisionId: string): Promise<RuntimeDecisionRow | undefined>;
  list(limit?: number): Promise<readonly RuntimeDecisionRow[]>;
  /** Associate an existing decision with an owner scope. Never reassigns an owned decision. */
  attachOwner(decisionId: string, ownerScopeKey: string): Promise<boolean>;
  listByOwner(ownerScopeKey: string, limit?: number): Promise<readonly RuntimeDecisionRow[]>;
}

export const createRuntimeDecisionRepository = (
  client: Pick<DatabaseClient, '$queryRaw'>,
): RuntimeDecisionRepository => ({
  async put(row) {
    // Decisions are immutable audit records: a repeated put of the same id is a no-op.
    await client.$queryRaw`INSERT INTO "RuntimeDecisionRecord" ("decisionId","runtimeId","correlationId","outcome","record","ownerScopeKey","recordedAt") VALUES (${row.decisionId},${row.runtimeId},${row.correlationId},${row.outcome},${jsonValue(row.record)}::jsonb,${row.ownerScopeKey ?? null},${row.recordedAt}) ON CONFLICT ("decisionId") DO NOTHING`;
  },
  async get(decisionId) {
    const rows =
      await client.$queryRaw`SELECT * FROM "RuntimeDecisionRecord" WHERE "decisionId" = ${decisionId} LIMIT 1`;
    return (rows as RuntimeDecisionRow[])[0];
  },
  async list(limit = 100) {
    const bounded = Math.min(1000, Math.max(1, limit));
    return (await client.$queryRaw`SELECT * FROM "RuntimeDecisionRecord" ORDER BY "recordedAt" DESC LIMIT ${bounded}`) as RuntimeDecisionRow[];
  },
  async attachOwner(decisionId, ownerScopeKey) {
    const updated =
      await client.$queryRaw`UPDATE "RuntimeDecisionRecord" SET "ownerScopeKey" = ${ownerScopeKey} WHERE "decisionId" = ${decisionId} AND "ownerScopeKey" IS NULL RETURNING "decisionId"`;
    return Array.isArray(updated) && updated.length > 0;
  },
  async listByOwner(ownerScopeKey, limit = 100) {
    const bounded = Math.min(1000, Math.max(1, limit));
    return (await client.$queryRaw`SELECT * FROM "RuntimeDecisionRecord" WHERE "ownerScopeKey" = ${ownerScopeKey} ORDER BY "recordedAt" DESC LIMIT ${bounded}`) as RuntimeDecisionRow[];
  },
});
