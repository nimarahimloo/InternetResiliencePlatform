# Phase 85 — Intent Assurance & Drift Management

## Status

**Contract formalized (issue #14).** Maps existing network-state reconciliation and outcome-verification capabilities already present on `main`. Disposition remains **PARTIAL** until CI evidence is recorded against this contract and the phase matrix is updated from evidence only. Implementation of net-new continuous drift-remediation workflows is unauthorized until this contract is accepted and PROJECT_STATE is updated.

## Objective

Provide continuous assurance that desired intent (and the derived desired network state) remains aligned with observed and actual state. Detect, classify, and report drift; feed structured drift signals into the closed-loop and safety boundaries without creating a second control plane or autonomous unbounded remediation path.

## Dependencies

- Phase 73 — Unified Network State Model
- Phase 77 — Safety, Rollback & Recovery Kernel
- Phase 78 — Closed-Loop Control Foundation
- Phase 79 — Intent Model & Lifecycle
- Phase 84 — Safety Constraints & Change Governance

## Canonical owner

- `@irp/resilience-runtime` — `src/state/network-state.ts` (`NetworkStateStore`, `ReconciliationStatus` including `drifted` / `aligned` / `conflicted`)
- Outcome verification: `src/verification/outcome-verification.ts` (`ScopedHealthSignal`, `buildHealthReport`, scoped health across nine dimensions)
- Consumed by closed-loop controller, safety kernel, and observation paths
- Tests: `packages/resilience-runtime/tests/network-state.test.ts` and verification suites

## Scope

- Maintain desired / observed / actual network-state layers and compute a deterministic `ReconciliationStatus`.
- Classify drift when desired ≠ actual (or observed diverges under defined rules).
- Emit structured health and drift signals scoped by resource, path, destination, service, application, workload, transport, region, and provider.
- Aggregate per-scope signals into an overall health report that never treats missing evidence as healthy.
- Expose the reconciliation and health report to the closed-loop and safety admission paths so drift can influence stop / recover / PLAN_ONLY decisions.
- Preserve local autonomy: state store remains usable without remote services.

## Non-goals

- Autonomous unbounded remediation loops that bypass the Phase 78 cycle bounds or Phase 84 governance.
- A second state authority or parallel drift engine outside `@irp/resilience-runtime`.
- Device-level or regional production certification evidence (tracked under issue #4).
- Human approval workflow UI for drift (later governance / fleet phases).

## Acceptance criteria

1. `NetworkStateStore` produces a `ReconciliationStatus` of `aligned` only when desired, observed, and actual signatures match; otherwise yields `drifted`, `pending`, `conflicted`, or `unknown` as defined by the reconciliation helper.
2. Drift detection is pure with respect to the supplied snapshots (no hidden side effects on the mutation boundary).
3. `buildHealthReport` aggregates scoped signals and reports the worst status; scopes with no signal remain `unknown`.
4. Unit tests cover: empty state → unknown, perfect match → aligned, desired≠actual → drifted, multi-scope health aggregation, and missing-evidence behaviour.
5. No new mutation path is introduced that bypasses the safety kernel or closed-loop stop conditions when acting on drift.
6. Architecture guards continue to forbid a second control-plane authority for state or drift.

## Verification boundary

- Local package tests for `@irp/resilience-runtime` (network-state and verification suites).
- CI workflows that already execute the resilience-runtime test suite.
- Architecture guards.
- Explicit non-claim of production certification or continuous-runtime drift remediation under load.

## Evidence map (baseline on current main)

| Criterion | Location |
|-----------|----------|
| Network state model & reconciliation | `packages/resilience-runtime/src/state/network-state.ts` |
| Network state tests | `packages/resilience-runtime/tests/network-state.test.ts` |
| Scoped health / outcome verification | `packages/resilience-runtime/src/verification/outcome-verification.ts` |
| Verification module | `packages/resilience-runtime/src/verification/verification.ts` |

## Known gaps (do not hide)

- Continuous, production-load drift detection and automatic bounded remediation under real traffic remain release/integration evidence, not satisfied by unit tests alone.
- Intent-to-desired-state projection end-to-end through API → runtime → state store may still require additional integration tests before any COMPLETE disposition.

## Rollback

Contract is documentation only; no runtime behaviour change. If later implementation diverges, revert the phase document and restore previous matrix disposition. Prefer fail-closed (report drift, stop or PLAN_ONLY) over silent continued mutation.

## Related issues

- Tracking: issue #14
- External blockers remain in issue #4
- Builds on Phase 73 state model and Phase 78 closed-loop foundation
