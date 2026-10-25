import { describe, expect, it } from 'vitest';
import {
  evaluateFabricFreshness,
  partitionByFreshness,
  selectDiverseResources,
  FabricCapabilityAuthority,
  type FabricResource,
  type FabricCapability,
} from '../src/index.js';

describe('Phase 87 — Multi-Interface Intelligence regressions', () => {
  const now = new Date().toISOString();

  const makeInterface = (overrides: Partial<FabricResource> = {}): FabricResource => ({
    id: 'iface-eth0',
    kind: 'Interface',
    state: 'HEALTHY',
    health: { status: 'healthy', score: 95, checkedAt: now },
    confidence: 0.95,
    observedAt: new Date(Date.now() - 10_000).toISOString(),
    trust: 0.9,
    capacity: { bandwidthMbps: 1000 },
    cost: { currency: 'USD', amount: 0 },
    owner: 'device',
    failureDomains: ['local-nic'],
    lifecycle: 'active',
    capabilities: ['link.up'],
    metadata: { media: 'ethernet' },
    ...overrides,
  });

  describe('Interface / Link modeling as FabricResource', () => {
    it('accepts Interface kind with health, capacity and freshness', () => {
      const iface = makeInterface();
      expect(iface.kind).toBe('Interface');
      const report = evaluateFabricFreshness(iface, now);
      expect(report.fresh).toBe(true);
      expect(report.ageMs).toBeLessThan(60_000);
    });

    it('models Link as companion resource', () => {
      const link: FabricResource = makeInterface({
        id: 'link-eth0',
        kind: 'Link',
        failureDomains: ['upstream-carrier'],
        metadata: { interfaceId: 'iface-eth0' },
      });
      expect(link.kind).toBe('Link');
    });
  });

  describe('freshness and partition for multi-interface candidates', () => {
    it('partitions fresh vs expired interfaces', () => {
      const fresh = makeInterface({ id: 'wifi' });
      const stale = makeInterface({
        id: 'cellular',
        expiresAt: new Date(Date.now() - 5_000).toISOString(),
      });
      const { fresh: f, stale: s } = partitionByFreshness([fresh, stale], now);
      expect(f.map((r) => r.id)).toContain('wifi');
      expect(s.map((r) => r.id)).toContain('cellular');
    });
  });

  describe('diverse selection across interfaces', () => {
    it('prefers failure-domain-disjoint interfaces', () => {
      const eth = makeInterface({ id: 'eth', failureDomains: ['nic-a'] });
      const wifi = makeInterface({ id: 'wifi', failureDomains: ['nic-b'] });
      const cellular = makeInterface({ id: 'cell', failureDomains: ['nic-a'] }); // shares with eth
      const ranked = [eth, wifi, cellular];
      const selection = selectDiverseResources(ranked, { required: 2 });
      expect(selection.diverse.map((r) => r.id)).toEqual(expect.arrayContaining(['eth', 'wifi']));
      expect(selection.distinctFailureDomains).toBeGreaterThanOrEqual(2);
    });
  });

  describe('capability authority restricts selectable interfaces by platform', () => {
    it('denies interface capability on unsupported platform', () => {
      const auth = new FabricCapabilityAuthority();
      const cap: FabricCapability = {
        id: 'interface.select',
        scope: 'interface',
        authority: 'runtime',
        trust: 0.9,
        safety: 'governed',
        platforms: ['linux'],
      };
      auth.register(cap);
      const decision = auth.authorize({
        capabilityId: 'interface.select',
        resourceId: 'iface-eth0',
        scope: 'interface',
        minimumTrust: 0.8,
        platform: 'ios',
        requireRuntimeAuthority: true,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.reasons.some((r) => r.toLowerCase().includes('platform'))).toBe(true);
    });

    it('allows matching platform and trust', () => {
      const auth = new FabricCapabilityAuthority();
      const cap: FabricCapability = {
        id: 'interface.select',
        scope: 'interface',
        authority: 'runtime',
        trust: 0.95,
        safety: 'governed',
        platforms: ['linux', 'any'],
      };
      auth.register(cap);
      const decision = auth.authorize({
        capabilityId: 'interface.select',
        resourceId: 'iface-eth0',
        scope: 'interface',
        minimumTrust: 0.8,
        platform: 'linux',
        requireRuntimeAuthority: true,
      });
      expect(decision.allowed).toBe(true);
    });
  });
});
