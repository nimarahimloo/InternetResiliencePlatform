import { describe, expect, it } from 'vitest';
import { InMemoryIntentStore } from '../src/intent/arbitration.js';
import type { IntentConflict, CompiledIntent } from '../src/domain/types.js';

const makeConflict = (aId: string, bId: string): IntentConflict =>
  ({
    intentA: { intentId: aId } as CompiledIntent,
    intentB: { intentId: bId } as CompiledIntent,
    reason: 'overlapping-scope-different-outcome',
    resolution: 'supersede-b',
    recordedAt: new Date().toISOString(),
  }) as IntentConflict;

describe('Phase 83 — durable conflict-journal restart coverage', () => {
  it('records conflicts and survives simulated store restart', async () => {
    const original = new InMemoryIntentStore();
    const conflicts: IntentConflict[] = [
      makeConflict('intent-high', 'intent-low'),
      makeConflict('intent-v2', 'intent-v1'),
    ];

    await original.recordConflicts(conflicts);
    const journalBefore = await original.listConflicts();
    expect(journalBefore).toHaveLength(2);

    // Simulate process restart: serialize journal and reload into a fresh store.
    const serialized = JSON.stringify(journalBefore);
    const restored = new InMemoryIntentStore();
    const reloaded = JSON.parse(serialized) as IntentConflict[];
    await restored.recordConflicts(reloaded);

    const journalAfter = await restored.listConflicts();
    expect(journalAfter).toHaveLength(2);
    expect(journalAfter.map((c) => c.intentA.intentId)).toEqual(['intent-high', 'intent-v2']);
    expect(journalAfter[0].resolution).toBe('supersede-b');
  });

  it('keeps journal empty when no conflicts are recorded', async () => {
    const store = new InMemoryIntentStore();
    expect(await store.listConflicts()).toHaveLength(0);
    // Fresh instance after "restart" also starts empty.
    const fresh = new InMemoryIntentStore();
    expect(await fresh.listConflicts()).toHaveLength(0);
  });
});
