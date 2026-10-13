# Phase 82 — Policy Decision & Enforcement Engine

## Status

Acceptance contract defined. Implementation exists as pure functions in `@irp/resilience-runtime` (arbitration + governance) and is mapped below. Authorization recorded in `PROJECT_STATE.md`.

## Objective

Provide the canonical policy decision and enforcement boundary that evaluates compiled intents against policy snapshots, autonomy levels, and safety constraints. Decisions are pure, deterministic, and must not become a second mutation or control-plane authority.

## Dependencies

- Phase 79 — Intent Model & Lifecycle
- Phase 81 — Intent Translation / Compilation
- Existing policy snapshot and autonomy contracts in `@irp/core` / domain types

## Affected packages

- `@irp/resilience-runtime` (`src/intent/arbitration.ts`, `src/intent/governance.ts`, tests in `tests/intent-governance.test.ts`)

## Canonical contract

- `arbitrateIntents(intents, now)` filters to effective intents, orders by priority/version, and reports conflicts.
- `enforceAutonomy(intent, policy)` returns a permission decision consistent with the autonomy level model.
- Governance functions produce bounded, explainable allow/deny/restrict outcomes.
- All functions are pure; they consume policy snapshots and never mutate network state themselves.

## Acceptance criteria

- Decisions are deterministic for identical inputs and timestamps.
- Autonomy levels (`OBSERVE_ONLY` … `HIGH_RISK_REQUIRES_APPROVAL`) are enforced; high-risk paths require explicit approval.
- Effective-window and priority ordering match documented semantics.
- Conflict and denial paths are covered by unit tests.
- No parallel policy engine is introduced; the functions are the single source of truth consumed by the canonical runtime.
- Repository gates are green on the implementing commit.

## Verification boundary

Unit tests prove the pure functions. End-to-end enforcement through a production entrypoint (API or daemon) that feeds the result into the ResilienceRuntime cycle is required before the phase can be marked COMPLETE. CI evidence is mandatory.

## Non-goals

Creating a new global policy store, performing network mutation, or replacing the Phase 77 safety kernel.

## Rollback

Revert the arbitration/governance modules and their tests. Existing Phase 79/81 contracts remain usable.

## Known residual

Durable ownership and stale-intent rejection across the API → runtime → Postgres path remain open and are not claimed here.
