# Phase 86 — Unified Connectivity Fabric

## Status

**Contract formalized (issue #14).** Implementation already present on `main` at baseline SHA `19392bc` in the fabric modules. Disposition remains **PARTIAL** until CI evidence is recorded against this contract and the phase matrix is updated from evidence only.

## Objective

Provide a single canonical connectivity fabric that unifies devices, interfaces, links, providers, gateways, routes, resolvers, tunnels, and other network resources under one capability-aware registry with freshness, diversity, and authority controls.

## Dependencies

- Phase 72 — Control-Plane Architecture Completion
- Phase 73 — Unified Network State Model
- Phase 78 — Closed-Loop Control Foundation

## Canonical owner

- `@irp/resilience-runtime` — `src/fabric.ts`, `src/fabric-authority.ts`, `src/fabric-lifecycle.ts`
- Related: gateway registry and observation providers
- Tests: resilience-runtime fabric and lifecycle suites

## Scope

- Unified resource model and capability registry.
- Authority decisions that enforce scope, trust, platform compatibility, and safety.
- Freshness evaluation and partitioning of resources.
- Diverse selection helpers that prefer independent paths.
- Integration points for closed-loop and decision orchestration without creating a second fabric authority.

## Non-goals

- Low-level data-plane packet forwarding (later data-plane phases).
- Multi-device fleet orchestration (Group G).
- A parallel fabric outside `@irp/resilience-runtime`.

## Acceptance criteria

1. Fabric capability registry answers authorization queries with structured decisions.
2. Freshness evaluation correctly classifies resources and partitions selectable sets.
3. Diverse selection prefers independent resources when available.
4. State transitions are asserted and illegal transitions are rejected.
5. Unit tests cover authority allow/deny, freshness, and selection paths.
6. Applicable package tests pass on the contract SHA.
7. No second fabric or capability authority is introduced.

## Verification boundary

Source presence is not completion. Phase 86 completion requires mapped paths, green tests/CI on a recorded SHA, and matrix update only from evidence regeneration.

## Evidence map (baseline SHA `19392bc`)

| Criterion | Location |
|-----------|----------|
| Fabric model | `packages/resilience-runtime/src/fabric.ts` |
| Capability authority | `packages/resilience-runtime/src/fabric-authority.ts` |
| Lifecycle & freshness | `packages/resilience-runtime/src/fabric-lifecycle.ts` |

## Known gaps (do not hide)

- Full multi-platform runtime evidence under real device conditions is part of release certification (issue #4).
- Dynamic resource discovery adapters may still be thin for some resource kinds.

## Rollback

Disable the fabric authority gate (return always-allow) while retaining the registry; prefer fail-closed over silent capability use.

## Authorization note

Issue #14 authorizes contract definition and mapping of existing capability. Gap-fill must extend the existing fabric modules, not create a parallel fabric.
