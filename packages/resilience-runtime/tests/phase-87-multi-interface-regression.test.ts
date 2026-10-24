import { describe, expect, it } from 'vitest';
import {
  selectDiverseResources,
  evaluateFabricFreshness,
  type FabricResource,
} from '../src/index.js';

describe('Phase 87 — Multi-Interface Intelligence regressions', () => {
  const now = new Date().toISOString();

  const makeInterface = (overrides: Partial<FabricResource> = {}): FabricResource => ({
    id: 'if-eth0',
    kind: 'Interface',
    state: 'HEALTHY',
    health: { status: 'healthy', score: 95, checkedAt: now },
    confidence: 0.95,
    observedAt: new Date(Date.now() - 10_000).toISOString(),
    trust: 0.9,
    capacity: { bandwidthMbps: 1000 },
    cost: { monetary: 0 },
    owner: 'device-1',
    failureDomains: ['wifi-segment-1'],
    lifecycle: 'active',
    capabilities: [],
    metadata: { media: 'ethernet' },
    ...overrides,
  });

  describe('multi-interface diverse selection', () => {
    it('selects highest-ranked interface and finds disjoint alternatives', () => {
      const eth = makeInterface({ id: 'eth0', failureDomains: ['wired-1'], health: { status: 'healthy', score: 98, checkedAt: now } });
      const wifi = makeInterface({ id: 'wlan0', failureDomains: ['wifi-1'], health: { status: 'healthy', score: 85, checkedAt: now } });
      const cellular = makeInterface({ id: 'wwan0', kind: 'Interface', failureDomains: ['cellular-1'], health: { status: 'degraded', score: 60, checkedAt: now } });

      const ranked = [eth, wifi, cellular];
      const result = selectDiverseResources(ranked, { required: 2 });

      expect(result.selected?.id).toBe('eth0');
      expect(result.diverse.length).toBeGreaterThanOrEqual(2);
      expect(result.distinctFailureDomains).toBeGreaterThanOrEqual(2);
      expect(result.reason).toContain('failure-domain-disjoint');
    });

    it('falls back when interfaces share failure domain', () => {
      const eth = makeInterface({ id: 'eth0', failureDomains: ['shared-provider'] });
      const vpn = makeInterface({ id: 'vpn0', failureDomains: ['shared-provider'] });

      const result = selectDiverseResources([eth, vpn], { required: 2 });
      expect(result.diverse.length).toBe(1);
      expect(result.fallback.length).toBe(1);
      expect(result.reason).toContain('fewer than 2');
    });
  });

  describe('interface freshness for selection', () => {
    it('classifies fresh interface observation as selectable', () => {
      const fresh = makeInterface();
      const report = evaluateFabricFreshness(fresh, now);
      expect(report.fresh).toBe(true);
    });

    it('classifies expired interface as stale', () => {
      const stale = makeInterface({ expiresAt: new Date(Date.now() - 5_000).toISOString() });
      const report = evaluateFabricFreshness(stale, now);
      expect(report.fresh).toBe(false);
    });
  });

  describe('kind restriction', () => {
    it('treats Interface and Link as first-class fabric kinds', () => {
      const iface = makeInterface({ kind: 'Interface' });
      const link = makeInterface({ id: 'link-1', kind: 'Link' });
      expect(iface.kind).toBe('Interface');
      expect(link.kind).toBe('Link');
    });
  });
});
