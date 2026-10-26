import {
  createRuntimeDecisionRepository,
  type DatabaseClient,
  type RuntimeDecisionRow,
} from '@irp/database';
import type { DecisionRecord, DecisionStore } from '@irp/resilience-runtime';
import { ownershipKey, type IntentOwnership } from './intent-api.js';

const toRecord = (row: RuntimeDecisionRow): DecisionRecord => {
  // `record` is a JSONB column: pg returns it parsed, but tolerate a string
  // payload so a driver difference can never surface as a corrupt decision.
  const raw = typeof row.record === 'string' ? JSON.parse(row.record) : row.record;
  return raw as DecisionRecord;
};

/**
 * PostgreSQL-backed decision store for the API's canonical runtime.
 *
 * It is a durable mirror only: `ResilienceRuntime` keeps its own local decision
 * authority and treats a failure here as degraded durability. Owner scoping is
 * attached after the fact by the intent handoff, because the runtime itself
 * has no notion of an API principal.
 */
export class DatabaseDecisionStore implements DecisionStore {
  private readonly repository: ReturnType<typeof createRuntimeDecisionRepository>;

  constructor(client: Pick<DatabaseClient, '$queryRaw'>) {
    this.repository = createRuntimeDecisionRepository(client);
  }

  async put(record: DecisionRecord): Promise<void> {
    await this.repository.put({
      decisionId: record.decisionId,
      runtimeId: record.runtimeContext.runtimeId,
      correlationId: record.runtimeContext.correlationId,
      outcome: record.outcome,
      record,
      recordedAt: record.createdAt,
    });
  }

  async get(id: string): Promise<DecisionRecord | undefined> {
    const row = await this.repository.get(id);
    return row ? toRecord(row) : undefined;
  }

  async list(): Promise<readonly DecisionRecord[]> {
    return (await this.repository.list(100)).map(toRecord);
  }

  /** Associate a decision with the owner whose intents produced it. */
  async attachOwner(decisionId: string, owner: IntentOwnership): Promise<boolean> {
    return this.repository.attachOwner(decisionId, ownershipKey(owner));
  }

  async listByOwner(owner: IntentOwnership, limit = 100): Promise<readonly DecisionRecord[]> {
    return (await this.repository.listByOwner(ownershipKey(owner), limit)).map(toRecord);
  }
}
