import { describe, expect, it } from 'vitest';
import { createCanonicalRuntime } from '../src/canonical-runtime-composition.js';
import type { DecisionRecord } from '../src/domain/types.js';
import type { DecisionStore } from '../src/ports/ports.js';
import { MirroredDecisionStore } from '../src/stores/mirrored-decision-store.js';

const fakeRecord = (decisionId: string): DecisionRecord => ({ decisionId }) as DecisionRecord;

class RecordingDurableStore implements DecisionStore {
  readonly rows = new Map<string, DecisionRecord>();
  async put(record: DecisionRecord) {
    this.rows.set(record.decisionId, record);
  }
  async list() {
    return [...this.rows.values()];
  }
  async get(id: string) {
    return this.rows.get(id);
  }
}

class FailingDurableStore implements DecisionStore {
  async put(): Promise<void> {
    throw new Error('database unavailable');
  }
  async list(): Promise<readonly DecisionRecord[]> {
    throw new Error('database unavailable');
  }
  async get(): Promise<DecisionRecord | undefined> {
    throw new Error('database unavailable');
  }
}

describe('MirroredDecisionStore', () => {
  it('writes locally and to the durable mirror, and reloads durable-only decisions', async () => {
    const durable = new RecordingDurableStore();
    await durable.put(fakeRecord('from-earlier-process'));
    const store = new MirroredDecisionStore(durable);

    await store.put(fakeRecord('local-1'));

    expect(durable.rows.has('local-1')).toBe(true);
    expect((await store.get('from-earlier-process'))?.decisionId).toBe('from-earlier-process');
    expect((await store.list()).map((r) => r.decisionId).sort()).toEqual([
      'from-earlier-process',
      'local-1',
    ]);
  });

  it('keeps local authority and reports degraded durability when the durable store fails', async () => {
    const failures: string[] = [];
    const store = new MirroredDecisionStore(new FailingDurableStore(), (error, record) =>
      failures.push(`${record.decisionId}:${(error as Error).message}`),
    );

    await expect(store.put(fakeRecord('local-2'))).resolves.toBeUndefined();

    expect(failures).toEqual(['local-2:database unavailable']);
    expect((await store.get('local-2'))?.decisionId).toBe('local-2');
    expect((await store.list()).map((r) => r.decisionId)).toEqual(['local-2']);
    expect(await store.get('missing')).toBeUndefined();
  });

  it('persists a canonical runtime decision durably and does not fail a cycle on durable outage', async () => {
    const durable = new RecordingDurableStore();
    const healthy = createCanonicalRuntime({
      executionMode: 'simulation',
      runtimeId: 'mirror-healthy',
      decisionStore: durable,
    }).runtime;
    const record = await healthy.runCycle({ mode: 'simulation', correlationId: 'mirror-1' });
    expect(durable.rows.get(record.decisionId)?.decisionId).toBe(record.decisionId);

    const degraded = createCanonicalRuntime({
      executionMode: 'simulation',
      runtimeId: 'mirror-degraded',
      decisionStore: new FailingDurableStore(),
    }).runtime;
    const survived = await degraded.runCycle({ mode: 'simulation', correlationId: 'mirror-2' });
    expect(survived.decisionId).toBeTruthy();
    expect((await degraded.getRuntimeSnapshot()).counters.degradedTotal).toBeGreaterThan(0);
  });
});
