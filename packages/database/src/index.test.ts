import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createIntentRepository, type DatabaseClient } from './index.js';

describe('phase 6 network database schema', () => {
  it('declares network intelligence models', () => {
    const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
    expect(schema).toContain('model NetworkMeasurement');
    expect(schema).toContain('model NetworkNode');
    expect(schema).toContain('model NetworkHealthScore');
  });

  it('declares durable intent ownership and idempotency storage', () => {
    const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
    expect(schema).toContain('model NetworkIntentRecord');
    expect(schema).toContain('ownerScopeKey String @db.VarChar(384)');
    expect(schema).toContain('@@unique([ownerScopeKey, idempotencyKey])');
  });
});

describe('owner-scoped intent repository bounds', () => {
  it('preserves the 101st row as an overflow sentinel for runtime arbitration', async () => {
    const queries: { sql: string; values: unknown[] }[] = [];
    const client = {
      async $queryRaw(strings: TemplateStringsArray, ...values: unknown[]) {
        queries.push({ sql: strings.join('?'), values });
        return [];
      },
    } as unknown as Pick<DatabaseClient, '$queryRaw'>;

    await createIntentRepository(client).list('active', 'principal:owner-a', 101);

    expect(queries).toHaveLength(1);
    expect(queries[0]?.sql).toContain('LIMIT ?');
    expect(queries[0]?.values).toContain(101);
  });
});
