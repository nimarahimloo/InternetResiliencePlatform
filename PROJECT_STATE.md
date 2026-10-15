# InternetResiliencePlatform — Canonical Project State

> Authoritative handoff point for continuing development from any account, agent, or future session.

## Current implementation gate

- **Current implementation baseline:** Phase 78 — Closed-Loop Control Foundation is implemented on `main`. Phase 78 is COMPLETE after matrix probe fix.
- **Current main HEAD reviewed this run:** `19392bc72870227a7034fe69746da79b60f9d8db` (merge of PR #26 updating state and fixing Phase 78 probe).
- **Issue #12 progress:** Phase 1–38 acceptance evidence register is complete with package/path/test anchors. Phase history matrix mapped for 1–38. Dispositions remain PARTIAL pending fresh per-phase CI evidence and full acceptance-criteria verification. No COMPLETE claimed from documentation alone.
- **Current open issues (authoritative tracker):** #4 (post-v0.2.1 runtime/signing/production certification — largely external blockers), #12 (evidence reconstruction largely complete; CI evidence remaining), #13 (contracts for 79–83 formalized; implementation gaps remain), #14 (authorize contracts for Groups B–L / Phases 84–150; Phase 84–85 contracts started).
- **Phase 77 status:** implementation is complete and merged on `main`; the safety/rollback/recovery kernel is available from `@irp/resilience-runtime`.
- **Phase 78 status:** the bounded closed-loop controller is implemented and COMPLETE on `main`.
- **Issue #13 progress:** acceptance contracts for Phases 79–83 formalized and merged (PR #22). Dispositions remain PARTIAL pending full verification evidence.
- **Issue #14 progress:** Phase 84 and 85 acceptance contracts formalized (commits on Oct 15).
- **Release state:** Phase 71 release-contract evidence exists: GitHub Release [v0.2.1](https://github.com/nimarahimloo/InternetResiliencePlatform/releases/tag/v0.2.1). Production certification (roadmap Step 6) remains open.
- **Phase 71 is a separate release-evidence gate:** it does not block architecture implementation in Phases 72–78, but it must not be represented as certified until its evidence exists.
- **Post-70 roadmap:** `docs/roadmap/MASTER_ROADMAP_V2.md` remains architectural reference material for Phases 72–150. Phases 79–83 contract definition is authorized by issue #13. Phases 84–150 require contracts and explicit PROJECT_STATE authorization before implementation starts.

## Phase 78 objective

Phase 78 formalizes a bounded observe → decide → apply → verify/recover control loop around the existing `@irp/resilience-runtime` cycle. The loop controller owns only bounded repetition, cancellation and deterministic stop conditions. It must not create a second decision engine, policy engine, execution engine or global control plane.

## Current Phase 78 implementation

- `packages/resilience-runtime/src/closed-loop.ts` provides `BoundedClosedLoopController`.
- The controller is safe-by-default with a one-cycle default and a hard maximum of 10 cycles.
- Each cycle receives deterministic correlation and idempotency suffixes.
- Blocked and failed decisions terminate the loop immediately.
- Healthy terminal outcomes stop the loop by default.
- Cooperative cancellation prevents the next runtime cycle from starting.
- Dedicated tests are in `packages/resilience-runtime/tests/closed-loop.test.ts`.
- The public runtime barrel exports the controller.

## Phase 71 certification prerequisites

The Phase 71 gate is limited to the release/distribution contract defined by `docs/phases/phase-71.md`. Remaining production certification (device smoke, regional validation, signing, security sign-off) is tracked in issue #4 and `docs/release/RELEASE_GATE_ROADMAP.md`.

## Canonical evidence locations

- Current state: this file.
- Release path and blockers: `docs/release/RELEASE_GATE_ROADMAP.md`.
- Current post-70 roadmap: `docs/roadmap/MASTER_ROADMAP_V2.md`.
- Historical 0–70 roadmap: `ROADMAP.md`.
- Current phase records: `docs/phases/` (including formalized Phase 79–85 contracts).
- Engineering governance: `docs/architecture/engineering-governance.md`.

## Product objective

IRP's long-term objective is a safe, observable and policy-governed Internet control plane that can continuously measure network conditions, diagnose failures, select and apply bounded changes, verify the result, recover from failure and explain decisions across supported clients and network providers.

Architecture invariant: ResilienceRuntime remains the sole production runtime authority. No competing control planes.
