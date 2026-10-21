import { describe, it, expect } from 'vitest';
import { rankInterfaces } from '../src/intent/interface-intelligence.js';
import type { FabricResource } from '../src/fabric.js';

const makeIface = (id: string, health: number, trust: number, cost = 0): FabricResource => ({
  id,
  kind: 'Interface',
  state: 'HEALTHY',
  health: { status: 'healthy', score: health, checkedAt: new Date().toISOString() },
  confidence: 0.9,
  observedAt: new Date().toISOString(),
  trust,
  capacity: {},
  cost: { value: cost },
  owner: 'test',
  failureDomains: [],
  lifecycle: 'active',
  capabilities: [{ id: 'dns', scope: 'local', authority: 'runtime', trust: 1, safety: 'safe', platforms: ['linux'] }],
  metadata: {},
});

describe('rankInterfaces', () => {
  it('orders by health then trust', () => {
    const a = makeIface('a', 80, 0.8);
    const b = makeIface('b', 95, 0.7);
    const c = makeIface('c', 90, 0.9);
    const result = rankInterfaces({ candidates: [a, b, c] });
    expect(result.ordered.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(result.reason).toContain('ranked');
  });

  it('filters by minimum trust', () => {
    const low = makeIface('low', 90, 0.4);
    const high = makeIface('high', 70, 0.8);
    const result = rankInterfaces({ candidates: [low, high], minimumTrust: 0.6 });
    expect(result.ordered.map((r) => r.id)).toEqual(['high']);
  });

  it('returns empty for no eligible', () => {
    const result = rankInterfaces({ candidates: [], minimumTrust: 0.5 });
    expect(result.ordered).toEqual([]);
    expect(result.reason).toContain('no eligible');
  });
});
