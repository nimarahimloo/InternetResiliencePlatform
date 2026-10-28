# Phase 94 — Traffic Classification

## Status

**Contract formalized; implementation not started.** This phase defines the acceptance contract for traffic classification within the existing fabric and intent boundaries. Disposition remains **NOT STARTED** until regression evidence and exact-SHA CI are recorded. No new runtime authority is introduced.

## Objective

Provide deterministic, policy-bounded traffic classification that tags or groups connectivity candidates (routes, paths, interfaces) using existing fabric attributes, intent constraints, and observed metadata without introducing a parallel classification engine or decision authority.

## Dependencies

- Phase 93 — Advanced Routing Control
- Phase 91 — Application-Aware Path Selection
- Phase 86 — Unified Connectivity Fabric
- Phase 82 — Policy Decision & Enforcement Engine

## Canonical owner

- `@irp/resilience-runtime` — fabric selection and metadata evaluation
- Consumed by bounded closed-loop and intent compilation
- Tests: resilience-runtime fabric and classification regression tests

## Scope

- Extend existing fabric resource metadata and selection ranking to support deterministic classification labels (e.g., application affinity, cost class, latency class, trust class) derived from observed attributes and compiled-intent constraints.
- Classification is pure, side-effect free, and fail-closed on unknown or invalid classifiers.
- Results are exposed as read-only evidence in selection audit or resource metadata; no direct mutation.
- Preserve existing freshness, trust, diversity, and capability gates.

## Non-goals

- Deep packet inspection or external traffic sniffing.
- ML-based or continuous classification outside closed-loop bounds.
- New policy language or competing decision engine.
- Production traffic engineering evidence.

## Evidence map (planned)

| Criterion | Location |
|-----------|----------|
| Deterministic classification by application/cost/trust metadata | `packages/resilience-runtime/tests/phase-94-traffic-classification.test.ts` |
| Intent-constrained class preference | same |
| Fail-closed on invalid or unknown classifier | same |
| Classification remains within existing fabric.select boundary | `packages/resilience-runtime/src/fabric.ts` |

## Acceptance criteria

1. Traffic classes can be derived deterministically from fabric resource attributes and compiled intent without side effects.
2. Intent constraints can filter or prefer classes.
3. Unknown or invalid classifiers cause fail-closed behavior.
4. Classification does not bypass existing safety, freshness, or diversity gates.
5. Unit tests covering derivation, preference, and fail-closed behavior pass.
6. Architecture guards continue to forbid competing classification or decision authorities.

## Verification boundary

- Package unit tests for `@irp/resilience-runtime`.
- Existing CI that runs those suites.
- No claim of live traffic classification until device/runtime validation exists.

## Rollback considerations

- Documentation-only until implementation lands.
- Any future classification extension must be safe-by-default, disableable, and must not weaken closed-loop stop conditions or fabric integrity.

## Related issues

- Tracking: open roadmap workstream (#272, #14)
- External blockers remain in issues #254, #323, #410, #412

Disposition remains NOT STARTED until regression evidence receives exact-SHA CI and the external runtime/release gates have their required independent evidence.
