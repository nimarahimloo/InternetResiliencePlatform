import type { FabricResource } from '../fabric.js';

export interface InterfaceRankingRequest {
  readonly candidates: readonly FabricResource[];
  readonly minimumTrust?: number;
  readonly requiredCapabilities?: readonly string[];
}

export interface InterfaceRankingResult {
  readonly ordered: readonly FabricResource[];
  readonly reason: string;
}

const score = (resource: FabricResource): number =>
  resource.health.score * 0.5 +
  resource.confidence * 100 * 0.25 +
  resource.trust * 100 * 0.2 -
  Object.values(resource.cost).reduce((s, v) => s + Math.max(0, v), 0) * 0.05;

/**
 * Pure advisory ranking of Interface fabric resources.
 * Higher score is better. Never mutates state.
 */
export const rankInterfaces = (request: InterfaceRankingRequest): InterfaceRankingResult => {
  const minTrust = request.minimumTrust ?? 0;
  const required = request.requiredCapabilities ?? [];

  const eligible = request.candidates.filter((r) => {
    if (r.kind !== 'Interface') return false;
    if (r.trust < minTrust) return false;
    if (required.length && !required.every((cap) => r.capabilities.some((c) => c.id === cap))) return false;
    return true;
  });

  const ordered = [...eligible].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));

  return Object.freeze({
    ordered: Object.freeze(ordered),
    reason: ordered.length ? `ranked ${ordered.length} interfaces by health/trust/cost` : 'no eligible interfaces',
  });
};
