import { describe, expect, it } from 'vitest';
import {
  evaluateFabricFreshness,
  partitionByFreshness,
  selectDiverseResources,
  FabricCapabilityAuthority,
  type FabricResource,
  type FabricCapability,
} from '../src/index.js';

const interfaceResource = (
  id: string,
  score: number,
  domain: string,
  kind: FabricResource['kind'] = 'Interface',
): FabricResource => ({
  id,
  kind,
  state: score >= 70 ? 'HEALTHY' : 'DEGRADED',
  health: {
    status: score >= 70 ? 'healthy' : 'degraded',
    score,
    checkedAt: new Date().toISOString(),
  },
  confidence: 0.85,
  observedAt: new Date(Date.now() - 10_000).toISOString(),
  trust: 0.9,
  capacity: { bandwidthMbps: score * 10 },
  cost: { unit: 1 },
  owner: 'device-a',
  failureDomains: [domain],
  lifecycle: 'active',
  capabilities: [
    {
      id: 'interface.select',
      scope: 'interface',
      authority: 'runtime',
      trust: 0.9,
      safety: 'governed',
      platforms: ['linux'],
    },
  ],
  metadata: { media: kind === 'Interface' ? 'ethernet' : 'link' },
});

describe('Phase 87 — Multi-Interface Intelligence regressions', () => {
  describe('interface selection and diversity', () => {
    it('selects diverse interfaces across failure domains', () => {
      const eth0 = interfaceResource('eth0', 90, 'isp-a');
      const wlan0 = interfaceResource('wlan0', 75, 'isp-b');
      const cellular = interfaceResource('cellular0', 60, 'isp-c', 'Link');

      const ranked = [eth0, wlan0, cellular];
      const selection = selectDiverseResources(ranked, { required: 2 });

      expect(selection.selected?.id).toBe('eth0');
      expect(selection.diverse.map((r) => r.id)).toEqual(['eth0', 'wlan0', 'cellular0']);
      expect(selection.distinctFailureDomains).toBe(3);
      expect(selection.reason).toContain('failure-domain-disjoint');
    });

    it('falls back when interfaces share failure domains', () => {
      const eth0 = interfaceResource('eth0', 90, 'isp-a');
      const eth1 = interfaceResource('eth1', 80, 'isp-a');

      const selection = selectDiverseResources([eth0, eth1], { required: 2 });
      expect(selection.diverse).toHaveLength(1);
      expect(selection.fallback).toHaveLength(1);
      expect(selection.distinctFailureDomains).toBe(1);
    });
  });

  describe('freshness for multi-interface candidates', () => {
    const now = new Date().toISOString();
    const base = interfaceResource('eth0', 85, 'isp-a');

    it('partitions fresh and stale interfaces', () => {
      const fresh = { ...base, id: 'fresh-if', observedAt: new Date(Date.now() - 5_000).toISOString() };
      const stale = {
        ...base,
        id: 'stale-if',
        expiresAt: new Date(Date.now() - 2_000).toISOString(),
      };

      const { fresh: freshOnes, stale: staleOnes } = partitionByFreshness([fresh, stale], now);
      expect(freshOnes.map((r) => r.id)).toEqual(['fresh-if']);
      expect(staleOnes.map((r) => r.id)).toEqual(['stale-if']);

      const report = evaluateFabricFreshness(stale, now);
      expect(report.fresh).toBe(false);
    });
  });

  describe('capability authority for interface selection', () => {
    it('rejects low-trust interface capability', () => {
      const auth = new FabricCapabilityAuthority();
      const cap: FabricCapability = {
        id: 'interface.select',
        scope: 'interface',
        authority: 'adapter',
        trust: 0.4,
        safety: 'safe',
        platforms: ['linux'],
      };
      auth.register(cap);

      const decision = auth.authorize({
        capabilityId: 'interface.select',
        resourceId: 'eth0',
        scope: 'interface',
        minimumTrust: 0.7,
        platform: 'linux',
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reasons.some((r) => r.includes('insufficient-trust'))).toBe(true);
    });

    it('allows high-trust runtime interface capability', () => {
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
        resourceId: 'eth0',
        scope: 'interface',
        minimumTrust: 0.8,
        platform: 'linux',
        requireRuntimeAuthority: true,
      });

      expect(decision.allowed).toBe(true);
    });
  });
});
