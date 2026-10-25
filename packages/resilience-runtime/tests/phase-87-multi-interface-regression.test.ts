import { describe, expect, it } from 'vitest';
import {
  selectDiverseResources,
  evaluateFabricFreshness,
  type FabricResource,
} from '../src/index.js';

describe('Phase 87 — Multi-Interface Intelligence regressions', () => {
  const now = new Date().toISOString();

  const makeInterface = (
    id: string,
    domains: string[],
    healthScore = 90,
    observedAgoMs = 10_000,
  ): FabricResource => ({
    id,
    kind: 'Interface',
    state: 'HEALTHY',
    health: { status: 'healthy', score: healthScore, checkedAt: now },
    confidence: 0.95,
    observedAt: new Date(Date.now() - observedAgoMs).toISOString(),
    trust: 0.9,
    capacity: { bandwidthMbps: 100 },
    cost: { monetary: 0 },
    owner: 'device-1',
    failureDomains: domains,
    lifecycle: 'active',
    capabilities: [],
    metadata: { interfaceType: id.includes('wifi') ? 'wifi' : 'ethernet' },
  });

  describe('diverse interface selection', () => {
    it('selects failure-domain-disjoint interfaces and reports diversity', () => {
      const ranked = [
        makeInterface('eth0', ['power-a', 'site-1']),
        makeInterface('wlan0', ['power-b', 'site-1']),
        makeInterface('eth1', ['power-a', 'site-2']),
      ];
      const result = selectDiverseResources(ranked, { required: 2 });
      expect(result.selected?.id).toBe('eth0');
      expect(result.diverse.map((r) => r.id)).toEqual(['eth0', 'wlan0']);
      expect(result.distinctFailureDomains).toBeGreaterThanOrEqual(2);
      expect(result.reason).toContain('failure-domain-disjoint');
    });

    it('falls back when insufficient disjoint domains', () => {
      const ranked = [
        makeInterface('eth0', ['shared']),
        makeInterface('wlan0', ['shared']),
      ];
      const result = selectDiverseResources(ranked, { required: 2 });
      expect(result.diverse).toHaveLength(1);
      expect(result.fallback).toHaveLength(1);
      expect(result.reason).toContain('fewer than');
    });
  });

  describe('interface freshness', () => {
    it('classifies recent interface observation as fresh', () => {
      const iface = makeInterface('eth0', ['d1']);
      const report = evaluateFabricFreshness(iface, now);
      expect(report.fresh).toBe(true);
    });

    it('classifies expired interface as stale', () => {
      const iface = {
        ...makeInterface('eth0', ['d1']),
        expiresAt: new Date(Date.now() - 5_000).toISOString(),
      };
      const report = evaluateFabricFreshness(iface, now);
      expect(report.fresh).toBe(false);
    });
  });
});
