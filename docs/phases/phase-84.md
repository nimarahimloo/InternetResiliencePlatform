# Phase 84 — Safety Constraints & Change Governance

## Status

**Contract formalized (issue #14).** Maps existing safety kernel and intent governance already present on `main`. Disposition remains **PARTIAL** until CI evidence is recorded against this contract and the phase matrix is updated from evidence only. Implementation of net-new governance workflows is unauthorized until this contract is accepted and PROJECT_STATE is updated.

Evidence mapping (current main):
- Safety kernel assessment, blast-radius rejection, checkpoint/rollback, recovery events, and no-execute invariant: `packages/resilience-runtime/src/safety/safety-kernel.ts` + `packages/resilience-runtime/tests/safety-kernel.test.ts`
- Intent governance admission (`ALLOW` / `PLAN_ONLY` / `REQUIRE_APPROVAL` / `DENY`), autonomy enforcement, stale rejection: `packages/resilience-runtime/src/intent/governance.ts` + `packages/resilience-runtime/tests/intent-governance.test.ts`

## Objective

Formalize bounded safety constraints and change-governance rules that every privileged mutation must pass before execution. The safety kernel assesses blast radius, checkpoints, and recovers; intent governance admits or denies compiled intents according to priority, autonomy, confidence and policy. Neither component executes mutations itself.

## Dependencies

- Phase 77 — Safety, Rollback & Recovery Kernel
- Phase 78 — Closed-Loop Control Foundation
- Phase 82 — Policy Decision & Enforcement Engine
- Phase 83 — Policy Conflict Resolution

## Canonical owner

- `@irp/resilience-runtime` — `src/safety/safety-kernel.ts` (`SafetyRollbackRecoveryKernel`, `SafetyAssessment`, `SafetyViolationError`)
- Intent governance: `src/intent/governance.ts` (`resolveIntentGovernance`, `selectGovernedIntents`, autonomy enforcement via `enforceAutonomy`)
- Consumed by privileged mutation boundary and closed-loop controller
- Tests: `packages/resilience-runtime/tests/safety-kernel.test.ts`, `packages/resilience-runtime/tests/intent-governance.test.ts`

## Scope

- Assess every candidate action plan for blast-radius limits (default max 0.75) before any mutation.
- Require checkpoint creation and expose deterministic rollback/recovery paths.
- Emit structured safety events; fail closed on violation.
- Govern compiled intents with ordered admission (`ALLOW` / `PLAN_ONLY` / `REQUIRE_APPROVAL` / `DENY`) based on priority, confidence, autonomy level and scope specificity.
- Preserve the invariant that the safety port never itself applies a mutation.

## Non-goals

- New external approval ticketing system or human workflow UI.
- Second safety engine or parallel governance authority outside `@irp/resilience-runtime`.
- Autonomous high-risk mutation without the existing privileged boundary and closed-loop stop conditions.
- Device-level or regional runtime evidence (tracked separately under issue #4).

## Acceptance criteria

1. `SafetyRollbackRecoveryKernel` rejects plans whose computed blast radius exceeds the configured maximum and returns a `SafetyAssessment` with reasons. — Covered by `safety-kernel.test.ts` ("blocks excessive blast radius").
2. Checkpoint and rollback callbacks, when supplied, are invoked on the assessment path and produce an `ActionExecution` result suitable for recovery. — Covered by `safety-kernel.test.ts` (checkpoint and rollback tests).
3. `enforceAutonomy` / `resolveIntentGovernance` returns a deterministic `IntentGovernanceDecision` that never permits mutation when autonomy or risk thresholds are violated. — Covered by `intent-governance.test.ts` (admission matrix, untrusted deny, advisory REQUIRE_APPROVAL, stale DENY).
4. Unit tests covering blast-radius rejection, successful checkpoint/rollback, and admission matrix (ALLOW / DENY / REQUIRE_APPROVAL) pass in the owning package. — Existing suites above.
5. No new mutation path is introduced that bypasses the safety kernel or intent governance. — Enforced by architecture invariants and the no-execute method assertion in `safety-kernel.test.ts`.

## Verification boundary

- Local package tests for `@irp/resilience-runtime`.
- CI workflows that already execute the resilience-runtime test suite (CI, Runtime Lab).
- Architecture guards that forbid a second control-plane authority.
- Explicit non-claim of production certification or device behavioral evidence.

## Rollback considerations

- Contract is documentation only; no runtime behavior change.
- If later implementation diverges, revert the phase document and restore previous matrix disposition.

## Related issues

- Tracking: issue #14
- External blockers remain in issue #4
