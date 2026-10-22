# Phase 94 — Traffic Classification

## Status

**Contract formalized (issue #14).** Foundational classification signals exist in observation and decision surfaces. Full traffic classification that binds application/service identity to path selection and policy remains **NOT STARTED** until this contract is accepted, PROJECT_STATE authorizes implementation, and evidence is produced. Disposition **NOT STARTED**.

## Objective

Provide a deterministic, policy-aware classification of observed traffic (by application, service, destination, or protocol signals) that can be consumed by intent governance, decision orchestration, and path selection without introducing a parallel classifier or control plane.

## Dependencies

- Phase 93 — Advanced Routing Control
- Phase 91 — Application-Aware Path Selection
- Phase 82 — Policy Decision & Enforcement Engine
- Phase 75 — Decision Orchestration
- Phase 100+ telemetry planes (advisory only)

## Canonical owner

- `@irp/resilience-runtime` — decision orchestration and fabric path selection consume classification labels
- Observation providers that already emit application/destination signals
- No new package; extend existing domain types and orchestration only

## Scope

- Define a bounded classification result type (label, confidence, evidence) that can be attached to observations or intents.
- Allow existing decision orchestration to prefer or filter paths based on classification labels present in policy or intent constraints.
- Classification remains advisory; mutation still requires safety kernel and closed-loop admission.
- Fail-closed when classification evidence is missing or below policy confidence threshold.

## Non-goals

- Deep packet inspection or new protocol parsers.
- Second classification engine or global traffic registry.
- Automatic mutation solely from classification.
- Fleet-wide or multi-device classification coordination.

## Acceptance criteria

1. Classification results are expressible using existing observation/intent models without new domain packages.
2. Decision orchestration can consume a classification label to rank or reject paths deterministically.
3. Any path change driven by classification still routes through the safety kernel and closed-loop.
4. Unit tests cover label consumption, confidence gating, and fail-closed absence of evidence.
5. Architecture guards continue to forbid competing classification or control-plane authorities.

## Verification boundary

- Package unit tests for `@irp/resilience-runtime`.
- Existing CI that runs those suites.
- No claim of live traffic classification until device/runtime validation exists.

## Rollback considerations

- Documentation-only until implementation.
- Future classification must be safe-by-default and must not weaken safety or closed-loop invariants.

## Related issues

- Tracking: issue #14
- External blockers remain in issue #4
