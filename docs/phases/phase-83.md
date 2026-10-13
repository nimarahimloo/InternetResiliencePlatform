# Phase 83 — Policy Conflict Resolution

## Status

Acceptance contract defined. Conflict detection and resolution logic exists inside `arbitrateIntents` and related governance functions. Authorization recorded in `PROJECT_STATE.md`.

## Objective

Detect and deterministically resolve conflicts between concurrent intents and between policy snapshots so that the canonical runtime receives a single ordered, conflict-free (or explicitly annotated) set of intents. Resolution must be pure, bounded, and auditable.

## Dependencies

- Phase 82 — Policy Decision & Enforcement Engine
- Phase 79 intent model and Phase 81 compiled form

## Affected packages

- `@irp/resilience-runtime` (`src/intent/arbitration.ts` — `IntentConflict`, `PolicyConflict`, arbitration ordering)
- Domain types that declare `IntentConflict` once

## Canonical contract

- Conflicts are reported as structured `IntentConflict` / `PolicyConflict` values (reason, parties, resolution strategy: union | intersection | hierarchical).
- Ordering is stable: priority (critical > high > normal > low), then higher version, then earlier creation.
- Resolution strategies are explicit and do not silently drop intents without recording the conflict.
- The function remains pure and does not introduce a second arbitration authority.

## Acceptance criteria

- Conflicting intents produce a deterministic ordered list plus an explicit conflict list.
- Resolution strategies are covered by tests (including hierarchical precedence).
- No silent loss of higher-priority intents.
- Existing tests in `intent-governance.test.ts` exercise conflict paths.
- Repository gates green on the implementing commit.
- Conflict journal (if present) records decisions without becoming a mutation authority.

## Verification boundary

Unit-level proof is necessary. Full completion requires evidence that resolved intents flow into the canonical ResilienceRuntime cycle and that conflicts are observable in telemetry or the conflict journal. CI evidence required.

## Non-goals

Multi-tenant isolation, distributed consensus, or AI-assisted conflict resolution.

## Rollback

Revert conflict-related logic in arbitration.ts. Core intent model remains intact.

## Known residual

End-to-end durable conflict journal persistence and stale-intent rejection are open follow-ups.
