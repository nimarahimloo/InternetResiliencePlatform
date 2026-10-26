import { describe, expect, it } from 'vitest';
import {
  ProgrammableConnectivityFabric,
  type FabricResource,
  type FabricCapability,
  FABRIC_RESOURCE_KINDS,
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
    cost: {},
    owner: 'device-1',
    failureDomains: ['nic-eth0'],
    lifecycle: 'active',
    capabilities: [],
    metadata: { media: 'ethernet' },
    ...overrides,
  });

  it('models interfaces exclusively as closed-kind FabricResource', () => {
    expect(FABRIC_RESOURCE_KINDS).toContain('Interface');
    const iface = makeInterface();
    expect(iface.kind).toBe('Interface');
  });

  it('selects fresh high-trust interface and rejects stale or low-trust', () => {
    const fabric = new ProgrammableConnectivityFabric();
    const fresh = makeInterface({ id: 'if-fresh' });
    const stale = makeInterface({
      id: 'if-stale',
      expiresAt: new Date(Date.now() - 5_000).toISOString(),
    });
    const lowTrust = makeInterface({ id: 'if-low', trust: 0.4 });

    // Direct snapshot injection for unit isolation (mirrors existing fabric tests)
    (fabric as any).snapshot = Object.freeze({
      version: 1,
      discoveredAt: now,
      resources: Object.freeze([fresh, stale, lowTrust]),
      edges: Object.freeze([]),
    });

    const result = fabric.select({
      kind: 'Interface',
      minimumTrust: 0.7,
      now,
    });

    expect(result.selected?.id).toBe('if-fresh');
    expect(result.rejected.some((r) => r.id === 'if-stale' && r.reason === 'stale-resource')).toBe(
      true,
    );
    expect(
      result.rejected.some((r) => r.id === 'if-low' && r.reason === 'insufficient-trust'),
    ).toBe(true);
  });

  it('capability authority can restrict interface selection by platform', () => {
    const fabric = new ProgrammableConnectivityFabric();
    const cap: FabricCapability = {
      id: 'interface.use',
      scope: 'interface',
      authority: 'runtime',
      trust: 0.9,
      safety: 'safe',
      platforms: ['linux'],
    };
    const iface = makeInterface({
      id: 'if-linux',
      capabilities: [cap],
    });
    fabric.capabilityAuthority.register(cap);
    (fabric as any).snapshot = Object.freeze({
      version: 1,
      discoveredAt: now,
      resources: Object.freeze([iface]),
      edges: Object.freeze([]),
    });

    const allowed = fabric.select({
      kind: 'Interface',
      requiredCapabilities: ['interface.use'],
      platform: 'linux',
      now,
    });
    expect(allowed.selected?.id).toBe('if-linux');

    const denied = fabric.select({
      kind: 'Interface',
      requiredCapabilities: ['interface.use'],
      platform: 'windows',
      now,
    });
    expect(denied.selected).toBeUndefined();
    expect(denied.rejected.some((r) => r.reason.includes('capability-denied'))).toBe(true);
  });
});
