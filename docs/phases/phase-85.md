# Phase 85 — Intent Assurance & Drift Management

## Status

Acceptance contract formalized. Implementation not started. Authorization recorded in `PROJECT_STATE.md`.

## Objective

Continuously assure that the observed network state remains compliant with the declared intent, detect drift, and trigger bounded correction or escalation through the existing closed-loop and safety machinery. Must reuse existing intent, policy, and observation surfaces.

## Dependencies

- Phase 79 — Intent Model & Lifecycle
- Phase 80 — Intent API & Ingestion
- Phase 81 — Intent Translation / Compilation
- Phase 78 — Closed-Loop Control Foundation
- Phase 84 — Safety Constraints & Change Governance

## Affected packages

- `@irp/resilience-runtime` (assurance loop integration)
- `@irp/core` (drift and assurance types)

## Scope

- Drift detection between desired intent outcome and observed state.
- Assurance report that classifies compliant / drifted / violated.
- Bounded correction proposal that is submitted to the existing decision and safety path (no independent mutation).
- Escalation path when correction would violate safety constraints.

## Non-goals

No new control plane, no autonomous mutation outside the existing transaction and closed-loop path, no AI decisioning.

## Acceptance criteria

1. Drift detection is deterministic and evidence-backed.
2. Assurance reports are typed and exported.
3. Correction proposals are submitted only through the canonical runtime entry points.
4. Safety constraints (Phase 84) are respected; unsafe corrections are rejected or escalated.
5. Unit and integration tests cover compliant, drifted, and blocked cases.
6. Repository gates (validate, typecheck, lint, test, build) are green.
7. Architecture invariants hold: single runtime authority.

## Verification boundary

Implementation plus passing tests and CI evidence required before COMPLETE disposition. Documentation alone is insufficient.

## Rollback

Remove assurance/drift modules and any wiring into the closed-loop controller. Existing intent model and Phase 78 behavior remain intact.
