import type { DecisionRecord } from '../domain/types.js';
import type { DecisionStore } from '../ports/ports.js';
import { InMemoryDecisionStore } from './memory.js';

/**
 * Decision store with an always-available local authority and an optional
 * durable mirror.
 *
 * The local in-memory store is written first and never depends on the durable
 * store, so a database outage cannot stop local control (reference architecture:
 * local autonomy survives optional remote/database outages). A durable write
 * failure is reported through `onDurableFailure` so the runtime can count it as
 * degraded durability instead of silently losing evidence.
 *
 * Reads merge the local store with the durable store, so decisions persisted by
 * an earlier process (or another instance) can be reloaded. Local records win
 * for the same decision id.
 */
export class MirroredDecisionStore implements DecisionStore {
  private readonly local = new InMemoryDecisionStore();

  constructor(
    private readonly durable?: DecisionStore,
    private readonly onDurableFailure?: (error: unknown, record: DecisionRecord) => void,
  ) {}

  async put(record: DecisionRecord): Promise<void> {
    await this.local.put(record);
    if (!this.durable) return;
    try {
      await this.durable.put(record);
    } catch (error) {
      this.onDurableFailure?.(error, record);
    }
  }

  async list(): Promise<readonly DecisionRecord[]> {
    const local = await this.local.list();
    if (!this.durable) return local;
    try {
      const durable = await this.durable.list();
      const known = new Set(local.map((record) => record.decisionId));
      return [...local, ...durable.filter((record) => !known.has(record.decisionId))];
    } catch {
      return local;
    }
  }

  async get(id: string): Promise<DecisionRecord | undefined> {
    const local = await this.local.get(id);
    if (local || !this.durable) return local;
    try {
      return await this.durable.get(id);
    } catch {
      return undefined;
    }
  }
}
