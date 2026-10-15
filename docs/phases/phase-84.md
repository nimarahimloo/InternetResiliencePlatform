# Phase 84 — Safety Constraints & Change Governance

## Status

Acceptance contract formalized. Implementation not started. Authorization recorded in `PROJECT_STATE.md`.

## Objective

Define explicit, enforceable safety constraints and change-governance rules that bound every autonomous or operator-initiated network mutation. Constraints must be evaluated before any action is planned or applied, and must integrate with the existing safety/rollback kernel without creating a parallel authority.

## Dependencies

- Phase 77 — Safety, Rollback & Recovery Kernel
- Phase 82 — Policy Decision & Enforcement Engine
- Phase 83 — Policy Conflict Resolution
- Phase 78 — Closed-Loop Control Foundation

## Affected packages

- `@irp/resilience-runtime` (extend existing safety surfaces)
- `@irp/core` (constraint model types)

## Scope

- Typed safety constraint model (blast-radius limits, change windows, approval thresholds, rate limits, preconditions).
- Governance policy that can require human approval for high-impact changes.
- Integration point that the action transaction engine and closed-loop controller must consult before execution.
- Deterministic, fail-closed evaluation.

## Non-goals

No new execution engine, no replacement of the existing safety kernel, no UI, no persistence beyond what the runtime already provides.

## Acceptance criteria

1. A canonical `SafetyConstraint` and `ChangeGovernancePolicy` type is exported from the appropriate package.
2. Evaluation is pure, deterministic, and fails closed on missing or invalid inputs.
3. High-impact changes can be marked as requiring explicit approval.
4. The closed-loop controller and action transaction path consult the governance check before applying mutations.
5. Unit tests cover normal, boundary, invalid, and failure cases.
6. `pnpm validate`, typecheck, lint, relevant package tests, and build are green.
7. No architecture violation is introduced (ResilienceRuntime remains the canonical runtime authority).

## Verification boundary

Source and tests must exist and pass. Phase is not COMPLETE until CI evidence on the merge commit is attached and the status matrix is regenerated.

## Rollback

Revert the constraint model, governance evaluator, and any wiring into the closed-loop or transaction path. Existing Phase 77 safety kernel behavior remains unchanged.
