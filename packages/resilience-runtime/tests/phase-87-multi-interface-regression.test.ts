import { describe, expect, it } from 'vitest';
import {
  ProgrammableConnectivityFabric,
  type FabricResource,
  type FabricDiscoveryProvider,
} from '../src/fabric.js';

const interfaceResource = (
  id: string,
  score: number,
  domain: string,
  platform: string = 'linux',
  trust = 0.9,
): FabricResource => ({
  id,
  kind: 'Interface',
  state: score >= 70 ? 'HEALTHY' : 'DEGRADED',
  health: {
    status: score >= 70 ? 'healthy' : 'degraded',
    score,
    checkedAt: new Date().toISOString(),
  },
  confidence: 0.9,
  observedAt: new Date().toISOString(),
  trust,
  capacity: { bandwidthMbps: score },
  cost: { unit: score >= 70 ? 1 : 2 },
  owner: 'device-local',
  failureDomains: [domain],
  lifecycle: 'active',
  capabilities: [
    {
      id: 'interface.select',
      scope: 'interface',
      authority: 'adapter',
      trust,
      safety: 'read-only',
      platforms: [platform],
    },
  ],
  metadata: { interfaceType: id.includes('wifi') ? 'wifi' : 'ethernet' },
});

describe('Phase 87 — Multi-Interface Intelligence regressions', () => {
  it('selects the highest-health Interface among multiple candidates', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    const provider: FabricDiscoveryProvider = {
      id: 'local-interfaces',
      owner: 'linux-client',
      async discover() {
        return [
          interfaceResource('eth0', 85, 'lan-a'),
          interfaceResource('wlan0', 70, 'wlan-a'),
          interfaceResource('eth1', 95, 'lan-b'),
        ];
      },
    };
    fabric.registerProvider(provider);
    await fabric.discover({ limit: 3 });
    const result = fabric.select({ kind: 'Interface', requiredCapabilities: ['interface.select'] });
    expect(result.selected?.id).toBe('eth1');
    expect(result.candidates.map((c) => c.id)).toEqual(['eth1', 'eth0', 'wlan0']);
  });

  it('restricts selectable interfaces by platform via capability authority', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    fabric.registerProvider({
      id: 'mixed-platforms',
      owner: 'device',
      async discover() {
        return [
          interfaceResource('linux-eth', 90, 'd1', 'linux'),
          interfaceResource('macos-wifi', 90, 'd2', 'macos'),
        ];
      },
    });
    await fabric.discover();
    const linuxOnly = fabric.select({
      kind: 'Interface',
      requiredCapabilities: ['interface.select'],
      platform: 'linux',
    });
    expect(linuxOnly.selected?.id).toBe('linux-eth');
    expect(linuxOnly.rejected.some((r) => r.id === 'macos-wifi')).toBe(true);
  });

  it('fails closed on stale multi-interface candidates while admitting fresh ones', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    const now = new Date();
    fabric.registerProvider({
      id: 'freshness-mix',
      owner: 'device',
      async discover() {
        return [
          {
            ...interfaceResource('stale-eth', 90, 'd1'),
            expiresAt: new Date(now.getTime() - 5_000).toISOString(),
          },
          interfaceResource('fresh-wlan', 80, 'd2'),
        ];
      },
    });
    await fabric.discover();
    const result = fabric.select({
      kind: 'Interface',
      requiredCapabilities: ['interface.select'],
      now: now.toISOString(),
    });
    expect(result.selected?.id).toBe('fresh-wlan');
    expect(result.rejected).toContainEqual({ id: 'stale-eth', reason: 'stale-resource' });
  });

  it('ranks by trust when health scores are equal', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    fabric.registerProvider({
      id: 'trust-rank',
      owner: 'device',
      async discover() {
        return [
          interfaceResource('low-trust', 85, 'd1', 'linux', 0.6),
          interfaceResource('high-trust', 85, 'd2', 'linux', 0.95),
        ];
      },
    });
    await fabric.discover();
    const result = fabric.select({ kind: 'Interface', requiredCapabilities: ['interface.select'] });
    expect(result.selected?.id).toBe('high-trust');
  });
});
