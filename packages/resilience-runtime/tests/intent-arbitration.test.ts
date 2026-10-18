import { describe, expect, it } from 'vitest';
import { arbitrateIntents } from '../src/intent/arbitration.js';
import type { CompiledIntent } from '../src/domain/types.js';

const baseIntent = (overrides: Partial<CompiledIntent> = {}): CompiledIntent => ({
  intentId: 'intent-1',
  version: 1,
  priority: 'normal',
  desiredOutcome: 'reach github.com',
  target: { destination: 'github.com' },
  constraints: {},
  objectives: {},
  confidence: 0.9,
  provenance: 'test',
  autonomy: 'SAFE_AUTOMATION',
  scope: { destination: 'github.com' },
  compiledAt: new Date().toISOString(),
  ...overrides,
});

describe('arbitrateIntents', () => {
  const now = new Date('2026-10-14T12:00:00Z');

  it('excludes stale intents outside the effective window', () => {
    const stale = baseIntent({
      intentId: 'stale',
      effectiveFrom: '2026-10-14T10:00:00Z',
      expiresAt: '2026-10-14T11:00:00Z', // expired before now
    });
    const active = baseIntent({
      intentId: 'active',
      effectiveFrom: '2026-10-14T11:00:00Z',
      expiresAt: '2026-10-14T13:00:00Z',
    });
    const future = baseIntent({
      intentId: 'future',
      effectiveFrom: '2026-10-14T13:00:00Z',
      expiresAt: '2026-10-14T14:00:00Z',
    });

    const result = arbitrateIntents([stale, active, future], now);

    expect(result.ordered.map((i) => i.intentId)).toEqual(['active']);
    expect(result.conflicts).toHaveLength(0);
  });

  it('orders by priority then version', () => {
    const low = baseIntent({ intentId: 'low', priority: 'low', version: 2 });
    const high = baseIntent({ intentId: 'high', priority: 'high', version: 1 });
    const normalNewer = baseIntent({ intentId: 'normal-newer', priority: 'normal', version: 3 });

    const result = arbitrateIntents([low, high, normalNewer], now);

    expect(result.ordered.map((i) => i.intentId)).toEqual(['high', 'normal-newer', 'low']);
  });

  it('detects conflicts on overlapping scopes with different outcomes', () => {
    const a = baseIntent({
      intentId: 'a',
      desiredOutcome: 'prefer dns-a',
      scope: { destination: 'example.com' },
      priority: 'high',
    });
    const b = baseIntent({
      intentId: 'b',
      desiredOutcome: 'prefer dns-b',
      scope: { destination: 'example.com' },
      priority: 'normal',
    });

    const result = arbitrateIntents([a, b], now);

    expect(result.ordered.map((i) => i.intentId)).toEqual(['a', 'b']);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.resolution).toBe('supersede-b');
  });

  it('does not conflict on identical outcomes or non-overlapping scopes', () => {
    const sameOutcome = baseIntent({
      intentId: 'same',
      desiredOutcome: 'reach github.com',
      scope: { destination: 'github.com' },
    });
    const other = baseIntent({
      intentId: 'other',
      desiredOutcome: 'reach github.com',
      scope: { destination: 'github.com' },
    });
    const nonOverlap = baseIntent({
      intentId: 'non',
      desiredOutcome: 'other',
      scope: { destination: 'other.com' },
    });

    const result = arbitrateIntents([sameOutcome, other, nonOverlap], now);

    expect(result.conflicts).toHaveLength(0);
  });
});
