# Phase 84 — Safety Constraints & Change Governance

## Status

**Contract formalized (issue #14).** Builds on Phase 77 Safety, Rollback & Recovery Kernel and Phase 78 Closed-Loop Control Foundation. Disposition remains **PARTIAL** until mapped implementation gaps are filled, CI evidence is recorded against this contract, and the phase matrix is regenerated from evidence only.

## Objective

Define and enforce bounded safety constraints and change-governance rules that gate any autonomous or operator-initiated network mutation. Governance is declarative, fail-closed, and owned by the existing resilience-runtime safety surfaces; it must not introduce a second policy or control plane.

## Dependencies

- Phase 77 — Safety, Rollback & Recovery Kernel
- Phase 78 — Closed-Loop Control Foundation
- Phase 79 — Intent Model & Lifecycle
- Phase 82 — Policy Decision & Enforcement Engine
- Phase 83 — Policy Conflict Resolution

## Canonical owner

- `@irp/resilience-runtime` — safety kernel, rollback/recovery surfaces, and closed-loop controller (`src/closed-loop.ts`, safety modules under `src/`)
- Policy and intent arbitration consumers already present for admission checks
- Tests: existing resilience-runtime safety and closed-loop suites; new or extended tests required for governance rules introduced by this phase

## Scope

- Declarative safety constraints (blast-radius limits, precondition checks, rate limits, allow/deny lists for mutation types).
- Change-governance rules that require explicit authorization or dual-control for high-impact mutations (extending existing policy admission).
- Integration with the bounded closed-loop so that blocked decisions terminate the loop immediately (already partially present).
- Audit/explainability hooks for blocked or constrained changes (reuse existing telemetry/explain surfaces).
- Fail-closed defaults: absence of an explicit allow is a deny.

## Non-goals

- Full human approval workflow / ticketing system (later phases).
- Data-plane enforcement or low-level packet filtering (Groups I / data-plane phases).
- A parallel safety engine outside `@irp/resilience-runtime`.
- Production device certification or real-network evidence (tracked under issue #4 and Phase 70/71 gates).

## Acceptance criteria

1. Safety constraints are expressed as typed, versioned policy objects consumable by the existing policy arbitration and closed-loop controller.
2. Precondition and blast-radius checks are evaluated before any apply step; failures produce a blocked decision and terminate the loop.
3. High-impact mutation classes require an explicit governance allow (or dual-control flag) that is checked in the same admission path.
4. All blocked outcomes are observable via existing explain/audit surfaces with a stable reason code.
5. Unit tests cover: allowed low-impact path, blocked high-impact without governance, precondition failure, blast-radius exceedance, and loop termination on block.
6. Applicable package tests (`@irp/resilience-runtime`) and repository gates pass on the contract SHA.
7. No new competing runtime authority is introduced.

## Verification boundary

Source presence and contract documentation are not completion. Phase 84 completion requires mapped paths, green tests/CI on a recorded SHA, and matrix update only from evidence regeneration. Real-device or production-network evidence remains out of scope for this phase contract.

## Evidence map (baseline SHA `ad822e66`)

| Criterion | Location (existing or to-extend) |
|-----------|----------------------------------|
| Safety kernel | Phase 77 surfaces in `@irp/resilience-runtime` |
| Closed-loop stop on block | `packages/resilience-runtime/src/closed-loop.ts` + tests |
| Policy admission | Existing policy modules under `packages/resilience-runtime/src/policy/` |
| Explain/audit | Existing explainDecision and telemetry surfaces |

## Known gaps (do not hide)

- Explicit typed safety-constraint schema and governance allow-list may still be thin; extend existing policy types rather than adding a parallel model.
- Durable persistence of governance decisions beyond in-memory/closed-loop tests is not required for this phase but must not be contradicted.

## Rollback

Remove or disable the new governance rule evaluations; fall back to Phase 77/78 fail-closed defaults. Existing closed-loop and policy surfaces remain functional.

## Authorization note

Issue #14 authorizes contract definition for Phases 84–150. Implementation of gaps must extend existing `@irp/resilience-runtime` safety/policy/closed-loop modules. PROJECT_STATE.md must be updated with explicit authorization before any implementation PR is merged.
