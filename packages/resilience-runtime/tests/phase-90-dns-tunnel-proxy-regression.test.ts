import { describe, expect, it } from 'vitest';
import {
  ProgrammableConnectivityFabric,
  type FabricResource,
  type FabricDiscoveryProvider,
} from '../src/index.js';

describe('Phase 90 — DNS / Tunnel / Proxy Orchestration regressions', () => {
  const now = new Date().toISOString();
  const makeResource = (
    id: string,
    kind: FabricResource['kind'],
    overrides: Partial<FabricResource> = {},
  ): FabricResource => ({
    id,
    kind,
    state: 'HEALTHY',
    health: { status: 'healthy', score: 90, checkedAt: now },
    confidence: 0.9,
    observedAt: now,
    trust: 0.85,
    capacity: { bandwidthMbps: 100 },
    cost: { latencyMs: 10 },
    owner: 'connectivity-adapter',
    failureDomains: [`fd-${id}`],
    lifecycle: 'active',
    capabilities: [
      {
        id: `${kind.toLowerCase()}.select`,
        scope: kind.toLowerCase(),
        authority: 'runtime',
        trust: 0.9,
        safety: 'governed',
        platforms: ['linux'],
      },
    ],
    metadata: { region: 'ir-central' },
    ...overrides,
  });

  it('selects among multiple healthy Resolver candidates preferring higher health', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    const primary = makeResource('resolver-primary', 'Resolver', {
      health: { status: 'healthy', score: 95, checkedAt: now },
      failureDomains: ['dns-a'],
    });
    const backup = makeResource('resolver-backup', 'Resolver', {
      health: { status: 'healthy', score: 75, checkedAt: now },
      cost: { latencyMs: 40 },
      failureDomains: ['dns-b'],
    });

    const provider: FabricDiscoveryProvider = {
      id: 'dns-sources',
      owner: 'connectivity-adapter',
      async discover() {
        return [primary, backup];
      },
    };
    fabric.registerProvider(provider);
    await fabric.discover();

    const result = fabric.select({ kind: 'Resolver', now });
    expect(result.selected?.id).toBe('resolver-primary');
    expect(result.candidates).toHaveLength(2);
    expect(result.diversity?.diverse.length).toBeGreaterThanOrEqual(1);
  });

  it('filters stale Tunnel resources from selection', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    const fresh = makeResource('tunnel-fresh', 'Tunnel');
    const stale = makeResource('tunnel-stale', 'Tunnel', {
      observedAt: new Date(Date.now() - 180_000).toISOString(),
      expiresAt: new Date(Date.now() - 90_000).toISOString(),
    });

    const provider: FabricDiscoveryProvider = {
      id: 'tunnel-sources',
      owner: 'connectivity-adapter',
      async discover() {
        return [fresh, stale];
      },
    };
    fabric.registerProvider(provider);
    await fabric.discover();

    const result = fabric.select({ kind: 'Tunnel', now });
    expect(result.selected?.id).toBe('tunnel-fresh');
    expect(result.candidates).toHaveLength(1);
    expect(result.rejected.some((r) => r.id === 'tunnel-stale' && r.reason === 'stale-resource')).toBe(
      true,
    );
  });

  it('supports diversity preference for Proxy and fails closed when required diversity is unmet', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    const sameDomain1 = makeResource('proxy-a', 'Proxy', { failureDomains: ['shared-egress'] });
    const sameDomain2 = makeResource('proxy-b', 'Proxy', { failureDomains: ['shared-egress'] });

    const provider: FabricDiscoveryProvider = {
      id: 'proxy-sources',
      owner: 'connectivity-adapter',
      async discover() {
        return [sameDomain1, sameDomain2];
      },
    };
    fabric.registerProvider(provider);
    await fabric.discover();

    const result = fabric.select({
      kind: 'Proxy',
      minimumDiverseAlternatives: 2,
      now,
    });
    expect(result.selected).toBeUndefined();
    expect(result.rejected.some((r) => r.reason === 'insufficient-failure-domain-diversity')).toBe(
      true,
    );
  });

  it('exposes Resolver / Tunnel / Proxy inventory attributes including ownership and failure domains', async () => {
    const fabric = new ProgrammableConnectivityFabric();
    const resolver = makeResource('resolver-inventory', 'Resolver', {
      owner: 'dns-control',
      failureDomains: ['dns-provider-1'],
    });
    const tunnel = makeResource('tunnel-inventory', 'Tunnel', {
      owner: 'tunnel-control',
      failureDomains: ['tunnel-provider-1'],
    });
    const proxy = makeResource('proxy-inventory', 'Proxy', {
      owner: 'proxy-control',
      failureDomains: ['proxy-egress-1'],
    });

    const provider: FabricDiscoveryProvider = {
      id: 'orchestration-inventory',
      owner: 'connectivity-adapter',
      async discover() {
        return [resolver, tunnel, proxy];
      },
    };
    fabric.registerProvider(provider);
    await fabric.discover();

    const snapshot = fabric.snapshotState();
    for (const expected of [
      { id: 'resolver-inventory', kind: 'Resolver', owner: 'dns-control' },
      { id: 'tunnel-inventory', kind: 'Tunnel', owner: 'tunnel-control' },
      { id: 'proxy-inventory', kind: 'Proxy', owner: 'proxy-control' },
    ]) {
      const resource = snapshot.resources.find((r) => r.id === expected.id);
      expect(resource).toBeDefined();
      expect(resource?.kind).toBe(expected.kind);
      expect(resource?.owner).toBe(expected.owner);
      expect(resource?.failureDomains.length).toBeGreaterThan(0);
      expect(resource?.health.status).toBe('healthy');
    }
  });
});
