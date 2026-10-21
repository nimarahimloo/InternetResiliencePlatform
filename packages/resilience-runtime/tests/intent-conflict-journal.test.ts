import { describe, expect, it } from 'vitest';
import { arbitrateIntents, InMemoryIntentStore } from '../src/intent/arbitration.js';
import type { CompiledIntent } from '../src/domain/types.js';

const makeIntent = (
  id: string,
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
  outcome = 'reach destination',
  scope: Record<string, unknown> = { destination: 'github.com' },
  version = 1,
): CompiledIntent => ({
  intentId: id,
  version,
  priority,
  desiredOutcome: outcome,
  target: {},
  constraints: {},
  objectives: {},
  confidence: 0.9,
  provenance: 'test',
  autonomy: 'SAFE_AUTOMATION',
  scope,
  compiledAt: new Date().toISOString(),
});

describe('intent conflict journal', () => {
  it('records conflicts from arbitration into InMemoryIntentStore', async () => {
    const a = makeIntent('a', 'high', 'prefer-a', { dest: 'x' });
    const b = makeIntent('b', 'normal', 'prefer-b', { dest: 'x' });
    const { ordered, conflicts } = arbitrateIntents([a, b]);

    expect(ordered[0]?.intentId).toBe('a');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.resolution).toBe('supersede-b');

    const store = new InMemoryIntentStore();
    await store.put(a);
    await store.put(b);
    await store.recordConflicts?.(conflicts);

    const recorded = await store.listConflicts();
    expect(recorded).toHaveLength(1);
    expect(recorded[0]?.intentA.intentId).toBe('a');
    expect(recorded[0]?.intentB.intentId).toBe('b');
    expect(recorded[0]?.resolution).toBe('supersede-b');
  });

  it('does not record when there are no conflicts', async () => {
    const a = makeIntent('a', 'high', 'same', { dest: 'x' });
    const b = makeIntent('b', 'normal', 'same', { dest: 'x' });
    const { conflicts } = arbitrateIntents([a, b]);
    expect(conflicts).toHaveLength(0);

    const store = new InMemoryIntentStore();
    await store.recordConflicts?.(conflicts);
    expect(await store.listConflicts()).toHaveLength(0);
  });

  it('filters stale intents before conflict detection and journaling', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const fresh = makeIntent('fresh', 'high', 'fresh-outcome');
    const stale = {
      ...makeIntent('stale', 'critical', 'stale-outcome'),
      expiresAt: '2020-01-01T00:00:00.000Z',
    };
    const { ordered, conflicts } = arbitrateIntents([fresh, stale], now);

    expect(ordered.map((i) => i.intentId)).toEqual(['fresh']);
    expect(conflicts).toHaveLength(0);

    const store = new InMemoryIntentStore();
    await store.recordConflicts?.(conflicts);
    expect(await store.listConflicts()).toHaveLength(0);
  });
});
