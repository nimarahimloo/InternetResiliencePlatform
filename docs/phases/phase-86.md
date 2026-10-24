# Phase 86 — Unified Connectivity Fabric

## Status

**Contract formalized and existing fabric implementation mapped (issue #14).** The connectivity fabric is present in `@irp/resilience-runtime` (`src/fabric.ts`, `src/fabric-authority.ts`, `src/fabric-lifecycle.ts`). Disposition remains **PARTIAL** pending exact-SHA CI evidence on the implementing commit and phase-matrix update from evidence only. Net-new fabric capabilities beyond the mapped surface remain unauthorized until this contract is accepted and PROJECT_STATE is updated.

## Evidence map (SHA `216b26ffa67a00da7c106552bac02052edf0eaff`)

| Criterion | Location |
|-----------|----------|
| Canonical `FabricResource` / kinds / states | `src/fabric.ts` (`FABRIC_RESOURCE_KINDS`, `FABRIC_RESOURCE_STATES`, `FabricResource`) |
| State transitions fail closed | `src/fabric-lifecycle.ts` (`assertFabricStateTransition`); exercised in discovery path |
| Freshness evaluation + stale rejection | `src/fabric-lifecycle.ts` (`evaluateFabricFreshness`, `partitionByFreshness`); `tests/fabric.test.ts` (`rejects stale resources...`) |
| Capability authority rejects unauthorized | `src/fabric-authority.ts` (`FabricCapabilityAuthority`); `tests/fabric.test.ts` (capability registration + selection with requiredCapabilities) |
| Diverse selection deterministic | `src/fabric-lifecycle.ts` (`selectDiverseResources`); used by `select` in `src/fabric.ts` |
| Ownership conflict fail-closed | `src/fabric.ts` (discover / reconcile); `tests/fabric.test.ts` (`rejects ... conflicting ownership`) |
| Package tests pass | `packages/resilience-runtime/tests/fabric.test.ts`, `fabric-275.test.ts`, `fabric-production-wiring.test.ts` |
| Architecture guards | existing architecture-invariants tests |

## Objective

Provide a single, canonical connectivity fabric that normalizes devices, interfaces, links, providers, gateways, tunnels, resolvers and egress resources into a consistent resource model with lifecycle, health, freshness and capability authority. The fabric is the sole source of selectable connectivity resources for decision and execution paths; it must not become a second control plane.

## Dependencies

- Phase 78 — Closed-Loop Control Foundation
- Phase 84 — Safety Constraints & Change Governance
- Existing gateway registry, DNS, tunnel and provider adapters

## Canonical owner

- `@irp/resilience-runtime` — `src/fabric.ts` (`FabricResource`, `FABRIC_RESOURCE_KINDS`, resource state machine), `src/fabric-authority.ts` (`FabricCapabilityAuthority`), `src/fabric-lifecycle.ts` (freshness, diverse selection, state transitions)
- Supporting: `@irp/connectivity`, `@irp/gateway-registry`, `@irp/network`
- Tests: `packages/resilience-runtime/tests/fabric*.test.ts`

## Scope

- Represent every connectivity primitive as a typed `FabricResource` with kind, state, health, confidence, trust, capacity and cost.
- Enforce deterministic state transitions and freshness evaluation.
- Apply capability authority so only governed, platform-compatible resources are selectable.
- Support diverse selection and partition-by-freshness for decision inputs.
- Expose the fabric to the closed-loop controller and decision orchestration without introducing a parallel mutation authority.

## Non-goals

- A second fabric or resource registry outside `@irp/resilience-runtime`.
- Direct mutation of network state from the fabric layer.
- Production device or regional fabric evidence (issue #4).
- Full multi-path or application-aware selection (later phases 87–91).

## Acceptance criteria

1. `FabricResource` and the closed set of `FABRIC_RESOURCE_KINDS` / `FABRIC_RESOURCE_STATES` are the canonical model; no competing resource type is used for selection.
2. State transitions are asserted and invalid transitions fail closed.
3. Freshness evaluation and diverse selection produce deterministic results consumable by the decision path.
4. Capability authority rejects unauthorized or incompatible resources before selection.
5. Package tests covering resource lifecycle, freshness, authority and selection pass in the owning package.
6. Architecture guards continue to treat `ResilienceRuntime` as the sole production control-plane authority.

## Verification boundary

- Local package tests for `@irp/resilience-runtime` fabric suites.
- CI workflows that execute the resilience-runtime test suite.
- Architecture guards.
- Explicit non-claim of production certification or live fabric evidence.

## Rollback considerations

- Contract is documentation only; no runtime behavior change.
- If later implementation diverges, revert the phase document and restore previous matrix disposition.

## Related issues

- Tracking: issue #14
- External blockers remain in issue #4
