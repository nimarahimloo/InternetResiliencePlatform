# Phase 87 — Multi-Interface Intelligence

## Status

**Contract formalized.** Minimal pure ranking helper implemented for interface selection advice. Disposition remains **PARTIAL** until CI evidence is recorded and full closed-loop integration is verified.

## Objective

Provide deterministic, advisory ranking of available interfaces (and related fabric resources) based on health, trust, capacity and intent constraints. Ranking is pure and side-effect free; it never mutates network state and is consumed only by the canonical decision path inside `@irp/resilience-runtime`.

## Dependencies

- Phase 86 — Unified Connectivity Fabric
- Phase 82 — Policy Decision & Enforcement Engine
- Phase 84 — Safety Constraints & Change Governance

## Canonical owner

- `@irp/resilience-runtime` — `src/intent/interface-intelligence.ts` (`rankInterfaces`)
- Consumes `FabricResource` of kind `Interface` from the existing fabric snapshot
- Tests: `packages/resilience-runtime/tests/interface-intelligence.test.ts`

## Scope

- Rank candidate interfaces by a weighted score of health.score, confidence, trust and inverse cost.
- Respect optional minimum trust and required capabilities filters.
- Return ordered candidates plus a reason string; never select or apply.
- Keep the function pure and deterministic.

## Non-goals

- Direct mutation or path installation.
- Second fabric or interface registry.
- Live device evidence (tracked under external gates).
- Full multi-path orchestration (Phase 88).

## Acceptance criteria

1. `rankInterfaces` returns candidates ordered by the documented score, higher better.
2. Filters for minimum trust and required capabilities are applied before ranking.
3. Identical inputs produce identical output (determinism).
4. Unit tests cover ranking order, filter rejection and empty-input cases.
5. No mutation path is introduced.

## Verification boundary

- Package unit tests.
- Existing resilience-runtime CI.
- Architecture invariants preserved.

## Rollback

Remove the helper and phase document; fabric selection remains unchanged.

## Related issues

- Tracking: issue #272 / #14
