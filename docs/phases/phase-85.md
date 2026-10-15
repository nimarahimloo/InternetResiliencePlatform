# Phase 85 — Intent Assurance & Drift Management

## Status

**Contract formalized (issue #14).** Builds on Phases 73–78 (state model, contracts, orchestration, transactions, safety, closed-loop) and Phases 79–84 (intent/policy/governance). Disposition remains **PARTIAL** until implementation gaps are filled against this contract, CI evidence is recorded, and the phase matrix is regenerated from evidence only.

## Objective

Continuously compare desired intent (and compiled policy outcomes) against observed/actual network state, detect drift, and drive bounded corrective action through the existing closed-loop and safety gates. Assurance is diagnostic and decision-supporting; it must not introduce a second control plane or mutate the network outside the canonical apply path.

## Dependencies

- Phase 73 — Unified Network State Model
- Phase 74 — Control-Plane Contracts
- Phase 78 — Closed-Loop Control Foundation
- Phase 79 — Intent Model & Lifecycle
- Phase 81 — Intent Translation / Compilation
- Phase 82 — Policy Decision & Enforcement Engine
- Phase 83 — Policy Conflict Resolution
- Phase 84 — Safety Constraints & Change Governance

## Canonical owner

- `@irp/resilience-runtime` — closed-loop (`src/closed-loop.ts`), intent surfaces (`src/intent/`), decision/verify paths, and any drift/assurance module introduced under this package
- Consumers of observe → decide → apply → verify already present in the runtime cycle
- Tests: extend closed-loop, intent-governance, and e2e-validation suites rather than a parallel harness

## Scope

- Typed representation of intent compliance (aligned / drifted / unknown) relative to observed and actual state.
- Deterministic drift detection against effective intents (using existing effective-window and arbitration semantics).
- Emission of structured drift records consumable by explain/audit and by the closed-loop as observation input.
- Bounded corrective plans only via existing decision orchestration and safety admission (Phase 84 constraints apply).
- Fail-closed behavior when observed state is insufficient to assess compliance.

## Non-goals

- Continuous autonomous remediation without safety/governance gates.
- Fleet-wide multi-device drift orchestration (Group G).
- Digital-twin or simulation-backed assurance (Phase 125).
- A parallel assurance engine outside `@irp/resilience-runtime`.
- Production-device certification evidence (issue #4 / Phase 70–71).

## Acceptance criteria

1. A public, typed compliance/drift result is produced from desired intent(s) + observed/actual state without performing network mutations.
2. Drift detection respects effective-window and arbitration ordering (Phases 79/83); stale intents do not generate false drift.
3. Drift and compliance outcomes are observable via existing explain/audit surfaces with stable reason codes.
4. Corrective action, if any, is proposed only as input to the existing closed-loop / decision path and is subject to Phase 84 safety constraints.
5. Unit tests cover: aligned path, drifted path, unknown/insufficient-observation path, stale-intent exclusion, and no-mutation invariant.
6. Applicable `@irp/resilience-runtime` tests and repository gates pass on the contract SHA.
7. No new competing runtime authority is introduced.

## Verification boundary

Documentation and source presence are not completion. Phase 85 completion requires mapped paths, green tests/CI on a recorded SHA, and matrix update only from evidence regeneration. Real-network continuous assurance remains out of scope for this contract.

## Evidence map (baseline SHA `ad822e66`)

| Criterion | Location (existing or to-extend) |
|-----------|----------------------------------|
| Closed-loop observe/verify | `packages/resilience-runtime/src/closed-loop.ts` |
| Intent model & effective window | `packages/resilience-runtime/src/intent/` |
| Decision / e2e validation | `packages/resilience-runtime/src/e2e-validation.ts`, decision modules |
| Explain / audit | Existing explainDecision and telemetry surfaces |

## Known gaps (do not hide)

- Explicit drift/compliance types and a dedicated detector module may not yet exist; introduce them under `@irp/resilience-runtime` without forking the control plane.
- Continuous production assurance against live devices is a later certification concern, not satisfied by unit tests alone.

## Rollback

Disable drift evaluation and return unknown/aligned-only diagnostics; closed-loop and intent surfaces remain operational. Prefer fail-closed assessment over silent false compliance.

## Authorization note

Issue #14 authorizes contract definition for Phases 84–150. Implementation of gaps must extend existing `@irp/resilience-runtime` modules. PROJECT_STATE.md must record explicit authorization before any implementation PR is merged.
