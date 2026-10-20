# InternetResiliencePlatform — Canonical Project State

> Authoritative handoff point for continuing development from any account, agent, or future session.

## Current implementation gate

- **Current implementation baseline:** Phase 79 — Intent Model & Lifecycle is implemented on `main`, with Phase 80 API ingestion, Phase 85 drift, and Phase 93 contract formalized.
- **Current main HEAD (inspected 2026-10-20):** `92467c4cef363fb0f71debdc1f7d5775dcfaa210` (merge of PR #80 docs/phase-93-contract-20261020, after prior intent ownership and drift work).
- **Issue #12 progress:** Evidence register and phase-history matrix contain package/path/test anchors for Phases 1–38. Historical test-count TSV is not fresh per-phase CI evidence; all these phases remain PARTIAL pending acceptance-criterion review and current-SHA verification. PR #71 added explicit anchors for Phases 39, 43, 44 and 46; remaining Phase 39–78 mappings and exact-SHA verification still need reconciliation. Issue #12 remains open.
- **Current open issues (authoritative tracker):** #4 (post-v0.2.1 runtime/signing/production certification — external blockers), #12 (reconstruct per-phase acceptance evidence for Phases 1–38 / verify 39–78), #13 (implement and verify remaining intent/policy gaps for Phases 79–83, especially durable ownership and stale compiled-intent fail-closed), #14 (verify Phases 84–92 and define/authorize contracts for Phases 93–150).
- **Phase 77 status:** implementation is complete and merged on `main`; the safety/rollback/recovery kernel is available from `@irp/resilience-runtime`.
- **Phase 78 status:** the bounded closed-loop controller is implemented and present on `main`, now optionally collecting observe-only Phase 85 drift assessments.
- **Issue #13 progress:** acceptance contracts for Phases 79–83 are merged. Recent work (PRs #55–#57, #75) addressed intent scope arbitration, conflict ownership, trusted live context/autonomy, owner-scoped runtime handoff, and e2e coverage. Remaining critical gaps: durable intent ownership through API → canonical runtime decision → PostgreSQL persistence/reload, plus full stale compiled-intent fail-closed evidence. In-memory or mocked-only evidence is insufficient; keep Issue #13 open.
- **Release state:** GitHub Releases `v0.2.0` and `v0.2.1` are developer-preview/prerelease evidence, not production certification. Production certification (roadmap Step 6) remains open. No passing exact-SHA Release Gate has been verified for the current main SHA. Phase 71 remains a separate release-evidence gate.
- **Issue #14 progress (2026-10-20):** Phase contracts 84–93 exist and remain PARTIAL. Phase 85 observe-only drift detector (`detectIntentDrift`) is on main with symmetric relative-deviation severity for unknown objectives (PR #74). It is integrated into `BoundedClosedLoopController` and remains advisory. Phase 93 contract formalized (PR #80); Phases 94–150 remain NOT STARTED until contracts and explicit authorization exist. No new runtime authority introduced.

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

- **Matrix reconciliation:** Generated phase matrices and PROJECT_STATE were previously desynchronized from main HEAD. Recent merges (including PR #72) and this update align the documented baseline to `92467c4cef363fb0f71debdc1f7d5775dcfaa210`. Dispositions remain 1 COMPLETE, ~88 PARTIAL, 3 BLOCKED, 58 NOT STARTED. These counts do not imply product completion. The generator remains the reproducible source of truth.
