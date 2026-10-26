# Phase 90 — DNS / Tunnel / Proxy Orchestration Integration

## Status

**Contract formalized.** Existing fabric resource kinds (`Resolver`, `Tunnel`, `Proxy`) and selection logic in `packages/resilience-runtime/src/fabric.ts` provide the integration surface. Health-aware selection, stale rejection, and diversity fail-closed behavior are covered by regression tests. Disposition **PARTIAL** pending exact-SHA CI evidence.

## Objective

Integrate DNS resolvers, tunnels, and proxies as selectable fabric resources within the unified connectivity fabric so that orchestration decisions can choose among them deterministically, with freshness, health, ownership, and failure-domain awareness, without introducing a second control-plane or selection authority.

## Dependencies

- Phase 86 — Unified Connectivity Fabric
- Phase 89 — Gateway Intelligence & Selection
- Phase 75 — Decision Orchestration
- Phase 77 — Safety, Rollback & Recovery Kernel
- Existing fabric selection and lifecycle helpers

## Canonical owner

- `@irp/resilience-runtime` — fabric selection, freshness, diversity for Resolver / Tunnel / Proxy kinds
- Consumed by closed-loop decision and verification paths
- Tests: `packages/resilience-runtime/tests/phase-90-dns-tunnel-proxy-regression.test.ts`

## Scope

- Treat DNS resolvers, tunnels, and proxies as first-class fabric resources with the same health, freshness, trust, capacity, cost, ownership, and failure-domain attributes as other kinds.
- Support deterministic selection among candidates of each kind, preferring higher health while respecting policy and capability constraints already enforced by the fabric.
- Reject stale or expired evidence and fail closed when a required failure-domain diversity floor cannot be met.
- Ensure any activation or steering request for these resources continues to pass existing governance and safety boundaries.

## Non-goals

- Live DNS server hosting, tunnel establishment, or proxy process management (adapter-specific).
- Parallel DNS/tunnel/proxy control planes outside resilience-runtime.
- Production multi-region or signed-device validation evidence.
- Predictive ranking or ML-driven selection (later phases).

## Evidence map (this change)

| Criterion | Location |
|-----------|----------|
| Resolver selection by health | `packages/resilience-runtime/tests/phase-90-dns-tunnel-proxy-regression.test.ts` |
| Stale Tunnel rejection | same |
| Proxy failure-domain diversity fail-closed | same |
| Inventory attributes (owner, failure domains, health) for all three kinds | same |
| Fabric kinds Resolver / Tunnel / Proxy | `packages/resilience-runtime/src/fabric.ts` |

## Acceptance criteria

1. Resolver, Tunnel, and Proxy inventory can be queried with required attributes (id, health, ownership, failure domains, freshness).
2. Selection among candidates of each kind is deterministic, excludes stale or failed entries, and respects existing capability and diversity constraints.
3. Activation or steering requests for these resources are routed through existing governance and safety kernel; no direct mutation from the fabric selection path.
4. Unit tests covering inventory queries, health filtering, stale rejection, and diversity fail-closed behavior pass in the owning package.
5. Architecture guards continue to forbid a competing control-plane or selection authority.

## Verification boundary

- Package unit tests for `@irp/resilience-runtime`.
- Existing CI that runs those suites.
- No claim of live DNS hosting, tunnel establishment, or proxy process evidence until device/runtime validation exists.

## Rollback considerations

- Documentation and regression tests only; no runtime authority changes.
- Any future orchestration feature must remain safe-by-default and disableable without affecting closed-loop stop conditions or fabric integrity.

## Related issues

- Tracking: issue #14 (connectivity fabric)
- External blockers remain in issues #254 / #323

Disposition remains PARTIAL pending exact-SHA CI evidence on the owning package tests.
