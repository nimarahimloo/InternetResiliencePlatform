# Phase 87 — Multi-Interface Intelligence

## Status

**Contract formalized (issue #14).** Existing interface discovery, health and selection primitives in the connectivity fabric and related packages map to multi-interface awareness. Full live multi-interface orchestration and preference learning remain **PARTIAL** / **NOT STARTED** until this contract is accepted, PROJECT_STATE authorizes further implementation, and evidence is produced. Disposition **PARTIAL** pending matrix update.

## Objective

Provide deterministic multi-interface intelligence that discovers, scores, and prefers available network interfaces (ethernet, wifi, cellular, virtual) according to health, capacity, cost, trust and policy, feeding the unified fabric without creating a parallel selection authority.

## Dependencies

- Phase 86 — Unified Connectivity Fabric
- Phase 73 — Unified Network State Model
- Phase 75 — Decision Orchestration
- Phase 77 — Safety, Rollback & Recovery Kernel

## Canonical owner

- `@irp/resilience-runtime` — fabric resource kinds include `Interface`
- `@irp/connectivity` — interface enumeration and basic health (where present)
- Consumed by fabric selection and decision orchestration
- Tests: existing fabric and connectivity package tests

## Scope

- Discover and represent host interfaces as `FabricResource` of kind `Interface` with health, capacity and failure-domain metadata.
- Score and rank interfaces for selection using deterministic criteria (health, trust, cost, diversity).
- Emit interface health changes into the fabric snapshot for closed-loop consumption.
- Preserve the invariant that interface activation/deactivation remains a privileged mutation gated by the safety kernel.

## Non-goals

- OS-specific interface configuration (ip link, NetworkManager) outside existing adapters.
- Second interface registry or scoring engine outside the fabric.
- Real-device multi-interface failover evidence (issue #4).
- Application-aware or predictive multi-interface decisions (later phases).

## Acceptance criteria

1. Interfaces appear as fabric resources with the declared kind and are included in fabric snapshots.
2. Selection logic can prefer one interface over another based on health/trust/cost without side effects.
3. Illegal or stale interface states are rejected or quarantined by lifecycle helpers.
4. Unit tests cover interface resource construction, scoring and fabric integration; no competing control plane is introduced.

## Verification boundary

- Package unit tests for fabric and connectivity modules.
- Existing CI workflows that exercise resilience-runtime and connectivity.
- No claim of live multi-interface runtime evidence until device validation exists.

## Rollback considerations

- Documentation-only until further implementation.
- Interface selection remains advisory until bound to the privileged execution path; can be disabled by configuration without affecting closed-loop stop conditions.

## Related issues

- Tracking: issue #14
