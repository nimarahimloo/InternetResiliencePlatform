# Phase 81 — Intent Translation / Compilation

## Status

Acceptance contract defined. Implementation exists in `@irp/resilience-runtime` and is mapped below. Authorization recorded in `PROJECT_STATE.md`.

## Objective

Compile a validated `NetworkIntent` (Phase 79) into a `CompiledIntent` that the canonical decision/orchestration path can consume. Compilation is pure, deterministic, and side-effect free. It must not perform policy evaluation, arbitration, or network mutation.

## Dependencies

- Phase 79 — Intent Model & Lifecycle
- Phase 80 — Intent API & Ingestion (for ingestion boundary; compilation itself is library-level)
- Existing `@irp/core` intent model and `@irp/resilience-runtime` domain types

## Affected packages

- `@irp/resilience-runtime` (`src/intent/compiler.ts`, tests in `tests/intent-compiler.test.ts`)
- Consumes `@irp/core` `NetworkIntent` / `isIntentEffective`

## Canonical contract

- `compileNetworkIntent(intent: NetworkIntent): CompiledIntent`
- Normalizes objectives to [0,1], derives defaults from outcome text when unspecified, freezes records, and preserves identity/version/effective window.
- `isCompiledIntentEffective(compiled, now)` reuses the same deterministic window semantics as the core model.
- No I/O, no clocks other than the supplied `now`, no mutation of the input intent.

## Acceptance criteria

- Compilation is pure and deterministic for identical inputs.
- Objectives are clamped to [0,1] and missing keys receive documented defaults.
- Effective-window evaluation matches Phase 79 semantics.
- Invalid or expired intents are not silently activated by the compiler.
- Existing unit tests in `packages/resilience-runtime/tests/intent-compiler.test.ts` cover normal, boundary, and invalid cases.
- Repository gates (`pnpm validate`, typecheck, lint, relevant tests, build) are green on the implementing commit.
- No second compilation authority is introduced.

## Verification boundary

Source presence and passing unit tests are necessary but not sufficient. Completion requires CI evidence on the commit that claims the phase, plus confirmation that the compiled form is consumed by the canonical runtime path (not a parallel one).

## Non-goals

Policy arbitration, conflict resolution, persistence, HTTP ingestion, scheduling, or direct execution.

## Rollback

Revert `compiler.ts` and its tests. Phase 79/80 contracts remain independently usable.

## Known residual (to be closed by follow-up)

Stale-intent rejection and durable ownership end-to-end through API → runtime → Postgres are tracked separately; they are not silently claimed by this phase.
