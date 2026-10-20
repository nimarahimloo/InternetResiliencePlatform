# InternetResiliencePlatform — Canonical Project State

> Authoritative handoff point for continuing development from any account, agent, or future session.

## Current implementation gate

- **Current implementation baseline:** Phase 78 — Closed-Loop Control Foundation is implemented on `main`.
- **Main baseline used for this reconciliation:** `cc7ffbce36dd30498aa8b16a4f52c41d68f75c0a` (main HEAD after merge of PR #75 owner-scoped intent handoff, inspected 2026-10-20). This records the verified input baseline rather than attempting to self-reference the future merge commit of this state update.
- **Issue #12 progress:** The evidence register and phase-history matrix contain package/path/test anchors for Phases 1–38. The register's historical test-count TSV is not fresh per-phase CI evidence, so all these phases remain PARTIAL pending acceptance-criterion review and current-SHA verification. PR #71 added explicit implementation/test/API-boundary anchors for Phases 39, 43, 44 and 46; the remaining Phase 39–78 mappings and exact-SHA verification still need reconciliation. Issue #12 remains open.
- **Current open issues (authoritative tracker):** #4 (post-v0.2.1 runtime/signing/production certification), #12 (reconstruct per-phase evidence for Phases 1–38 and verify mappings for 39–78), #13 (implement and verify remaining intent/policy gaps for Phases 79–83), #14 (verify Phases 84–92 and define/authorize contracts for Phases 93–150).
- **Phase 77 status:** implementation is complete and merged on `main`; the safety/rollback/recovery kernel is available from `@irp/resilience-runtime`.
- **Phase 78 status:** the bounded closed-loop controller is implemented and present on `main`.
- **Issue #13 progress:** acceptance contracts for Phases 79–83 are merged. PRs #55–#57 addressed intent scope arbitration, conflict ownership, trusted live context/autonomy, and e2e coverage. Remaining critical gaps are durable intent ownership through API → canonical runtime decision → PostgreSQL persistence/reload, plus full stale compiled-intent fail-closed evidence. In-memory or mocked-only evidence is insufficient; keep Issue #13 open.
- **Release state:** GitHub Releases `v0.2.0` and `v0.2.1` are developer-preview/prerelease evidence, not production certification. Production certification (roadmap Step 6) remains open. PR #71's repository CI, System Assurance, Runtime Lab, CodeQL, Deep Audit, and supported-client checks passed on the PR head tree. This is not a Release Gate pass: the latest documented Release Gate failure (API typecheck) must be re-evaluated separately on an exact current SHA before any stable release.
- **Phase 71 is a separate release-evidence gate:** it does not block architecture implementation in Phases 72–78, but it must not be represented as certified until its evidence exists.
- **Issue #14 progress (2026-10-19):** Phase contracts 84–92 exist and remain PARTIAL until acceptance-criterion mapping and verification are evidenced. Phase 85's observe-only drift assessment is integrated into `BoundedClosedLoopController` in `packages/resilience-runtime/src/closed-loop.ts`; it must remain advisory and never bypass governance. Phases 93–150 are still NOT STARTED: each requires a phase-specific contract and explicit authorization before implementation. No new runtime authority is permitted.

## Phase 78 objective

Phase 78 formalizes a bounded observe → decide → apply → verify/recover control loop around the existing `@irp/resilience-runtime` cycle. The loop controller owns only bounded repetition, cancellation and deterministic stop conditions. It must not create a second decision engine, policy engine, execution engine or global control plane.

## Current Phase 78 implementation

- `packages/resilience-runtime/src/closed-loop.ts` provides `BoundedClosedLoopController`.
- The controller is safe-by-default with a one-cycle default and a hard maximum of 10 cycles.
- Each cycle receives deterministic correlation and idempotency suffixes.
- Blocked and failed decisions terminate the loop immediately.
- Healthy terminal outcomes stop the loop by default.
- Cooperative cancellation prevents the next runtime cycle from starting.
- Optional per-cycle observe-only intent drift assessments (Phase 85) are collected when `driftInputs` are supplied; they never invoke privileged mutation.
- Dedicated tests are in `packages/resilience-runtime/tests/closed-loop.test.ts`.
- The public runtime barrel exports the controller.
- Observe-only Phase 85 drift assessments are optionally collected and attached without triggering mutation.

## Phase 71 certification prerequisites

The Phase 71 gate is limited to the release/distribution contract defined by `docs/phases/phase-71.md`. Remaining production certification (device smoke, regional validation, signing, security sign-off) is tracked in issue #4 and `docs/release/RELEASE_GATE_ROADMAP.md`.

## Canonical evidence locations

- Current state: this file.
- Release path and blockers: `docs/release/RELEASE_GATE_ROADMAP.md`.
- Current post-70 roadmap: `docs/roadmap/MASTER_ROADMAP_V2.md`.
- Historical 0–70 roadmap: `ROADMAP.md`.
- Current phase records: `docs/phases/` (including formalized Phase 79–92 contracts under issues #13/#14).
- Engineering governance: `docs/architecture/engineering-governance.md`.

## Product objective

IRP's long-term objective is a safe, observable and policy-governed Internet control plane that can continuously measure network conditions, diagnose failures, select and apply bounded changes, verify the result, recover from failure and explain decisions across supported clients and network providers.

- **Issue #14 progress (2026-10-17):** Phase 86–92 contracts added (docs/phases/phase-86.md through phase-92.md). Maps existing fabric, routing, gateway, DNS, tunnel, application path, and assurance surfaces; no new runtime authority introduced. Matrix update deferred until evidence exists.
- **Matrix reconciliation:** Before this update, both generated phase matrices still named `2c8610ce2b3e6c7b603dbfcb575366b687886792` as their source SHA despite later merged changes. This branch synchronizes the matrix source SHA to the verified input commit and updates probe counts affected by PR #71's four phase-record additions. Dispositions are unchanged: 1 COMPLETE, 88 PARTIAL, 3 BLOCKED, 58 NOT STARTED. These counts do not imply product completion. The generator remains the reproducible source of truth and should be run in a checkout for future matrix changes.
