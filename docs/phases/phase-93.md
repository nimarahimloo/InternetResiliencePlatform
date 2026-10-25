# Phase 93 — Advanced Routing Control

## Status

**Contract formalized (issue #14).** Existing routing, path-selection, and decision-orchestration surfaces provide foundational primitives. Full advanced routing control that supports policy-driven route selection, multi-path preference, and bounded re-routing remains **NOT STARTED** until this contract is accepted, PROJECT_STATE authorizes implementation, and evidence is produced. Disposition **NOT STARTED**.

## Objective

Extend the canonical decision orchestration and fabric path-selection mechanisms to support advanced, policy-bounded routing control (preference ordering, multi-path selection criteria, and deterministic re-routing) without introducing a parallel routing engine or control plane.

## Dependencies

- Phase 88 — Multi-Path Connectivity Management
- Phase 89 — Gateway Intelligence & Selection
- Phase 75 — Decision Orchestration
- Phase 78 — Closed-Loop Control Foundation
- Phase 77 — Safety, Rollback & Recovery Kernel
- Phase 82 — Policy Decision & Enforcement Engine

## Canonical owner

- `@irp/resilience-runtime` — decision orchestration, fabric path selection, closed-loop application of routing decisions
- Consumed by existing policy and safety kernels
- Tests: resilience-runtime decision, fabric, and closed-loop tests

## Scope

- Define typed routing preference and selection criteria that can be attached to intents or policy snapshots.
- Allow the existing decision orchestration to rank and select among available paths/gateways using those criteria.
- Ensure any re-routing is applied through the safety kernel and bounded closed-loop; no direct fabric mutation.
- Preserve deterministic, fail-closed behavior when routing criteria cannot be satisfied.
- Expose routing decisions as auditable outcomes.

## Non-goals

- New routing protocol implementation or BGP-style control plane.
- Unbounded autonomous re-routing outside closed-loop limits.
- Data-plane forwarding changes (later Group I).
- Multi-device or fleet-wide routing coordination (Group G).

## Acceptance criteria

1. Routing preference criteria are expressible in the existing intent/policy model without new domain packages.
2. Decision orchestration can deterministically select or rank paths using the criteria and current fabric state.
3. Selected routing changes are routed through the safety kernel and closed-loop; no parallel mutation path exists.
4. Fail-closed behavior is tested when no path satisfies the criteria.
5. Unit tests in the owning package cover selection, ranking, and safety-boundary routing.
6. Architecture guards continue to forbid competing routing or control-plane authorities.

## Verification boundary

- Package unit tests for `@irp/resilience-runtime` (decision orchestration, fabric, closed-loop).
- Existing CI that runs those suites.
- No claim of live multi-path routing until device/runtime validation exists.

## Rollback considerations

- Documentation-only until implementation lands.
- Any future routing feature must be safe-by-default, disableable, and must not weaken closed-loop stop conditions or safety kernel invariants.

## Related issues

- Tracking: issue #14
- External blockers remain in issue #4
