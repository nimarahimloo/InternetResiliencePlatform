# InternetResiliencePlatform — Canonical Project State

> Authoritative handoff point for continuing development from any account, agent, or future session.

## Current implementation gate

- **Current implementation baseline:** Phase 82 — Policy Decision & Enforcement Engine (intent-scoped) is implemented on `main`. Phases 83–85 have formalized contracts and partial/observe-only implementations present.
- **Current main HEAD (2026-10-22):** `e5c6db1b8445d0e200cf066ce8a8e7da2ff46fb7` (prior checkpoint; live tree inspected at 4fed2238). This checkpoint records inspection against live tree.
- **Issue #12 progress:** Evidence register and phase-history matrix contain package/path/test anchors for Phases 1–38. Historical test-count TSV is not fresh per-phase CI evidence; all these phases remain PARTIAL pending acceptance-criterion review and current-SHA verification. Remaining Phase 39–78 mappings and exact-SHA verification still need reconciliation. Issue #12 remains open.
- **Current open issues (authoritative tracker):** #254 (Linux Client runtime wiring), #272 (EPIC: Autonomous Network Superplatform — Full-System Reconstruction & Completion), #284 (Workstream: Full Verification, CI/CD, Deployment & Final Evidence), #323 (Final External Validation Gate — Remote CI, Linux Runtime Soak & Release Evidence). Additional fork trackers #4/#12/#13/#14 cover certification, evidence reconstruction and intent/policy gaps.
- **Phase 77 status:** implementation is complete and merged on `main`; the safety/rollback/recovery kernel is available from `@irp/resilience-runtime`.
- **Phase 78 status:** the bounded closed-loop controller is implemented and present on `main`, optionally collecting observe-only Phase 85 drift assessments.
- **Phase 79 status:** NetworkIntent model, lifecycle transitions, effective-window evaluation, autonomy levels and dedicated tests are implemented and present on `main` in `packages/core/src/intent.ts` and `intent.test.ts`. Exported from the core barrel.
- **Phase 80 status:** Intent API & Ingestion is implemented on `main` in `apps/api/src/intent-api.ts` (authenticated routes for create/list/get/commands, Idempotency-Key, in-memory and database stores, ownership isolation via `ownershipOf` / `ownershipKey`). Routes registered from the API entrypoint. Tests present. No network mutation from the API boundary.
- **Phase 81 status:** Intent Translation / Compilation is implemented on `main` in `packages/resilience-runtime/src/intent/compiler.ts` (`compileNetworkIntent`, `isCompiledIntentEffective`). Pure, deterministic, side-effect free. Tests present.
- **Phase 82 status:** Intent-scoped Policy Decision & Enforcement is implemented on `main` via `packages/resilience-runtime/src/intent/governance.ts` (`resolveIntentGovernance`, `selectGovernedIntents`) and autonomy gates. Admission decisions, stale rejection, mode-gated `mutationAllowed`. Tests present. Broader declarative policy language remains later roadmap work.
- **Phase 83 status:** Contract formalized. `arbitrateIntents` + `IntentStore.recordConflicts` present in `packages/resilience-runtime/src/intent/arbitration.ts`; tests cover effective filter, priority/version ordering, overlap detection, supersession, non-overlap. Disposition PARTIAL pending exact-SHA CI evidence and matrix update.
- **Phase 84 status:** Contract formalized. Maps existing `SafetyRollbackRecoveryKernel` and intent governance. Disposition PARTIAL pending CI evidence.
- **Phase 85 status:** Contract formalized. Observe-only `detectIntentDrift` implemented; closed-loop collects assessments when supplied. Disposition PARTIAL pending CI evidence. Full continuous correction out of scope.
- **Issue #13 progress:** acceptance contracts for Phases 79–83 are merged. Recent work addressed intent scope arbitration, conflict ownership, trusted live context/autonomy, owner-scoped runtime handoff, and e2e coverage. The runtime decision produced by the owner-scoped handoff is now persisted to PostgreSQL (`RuntimeDecisionRecord`, optional `decisionStore` on `ResilienceRuntime`, local in-memory authority retained, durable failure counted as degraded) and reloaded under its owner scope; this is verified against a real PostgreSQL in `apps/api/src/intent-api.postgres.integration.test.ts`. The legacy `/api/v1/autopilot/runs` and `/api/v1/autopilot/runs/:id` listing surfaces now use `DatabaseDecisionStore.listByOwner` when a durable store is present (falling back to the in-memory authority otherwise), so owner-scoped decision retrieval is available. A follow-up hardened this: every decision surface (`/autopilot/runs`, `/autopilot/runs/:id`, `/autopilot/actions`, `/runtime/decisions`, `/runtime/decisions/:id/explanation`) now resolves the same owner scope as the intent handoff (organization first, then principal), `POST /autopilot/runs` links its decision to the caller, and decision ids are unique across restarts (`nextUniqueId`; the process-local counter would reissue persisted ids after a restart and the durable insert would silently drop the new decision). Remaining gaps: exact-SHA CI evidence for this path and broader stale compiled-intent fail-closed evidence. In-memory or mocked-only evidence is insufficient; keep Issue #13 open.
- **Release state:** GitHub Releases `v0.2.0` and `v0.2.1` are developer-preview/prerelease evidence, not production certification. Production certification remains open. Exact-SHA Release Gate evidence must be verified before any stronger release claim. On prior SHA the Release Gate was FAIL/BLOCKED pending Public Runtime Lab; re-verify on current HEAD.
- **Phase 71 is a separate release-evidence gate:** it does not block architecture implementation in Phases 72–82, but it must not be represented as certified until its evidence exists.
- **Phases 86–150:** contracts for 79–92 exist; implementation for 86+ remains partial or not started. No new runtime authority introduced. ResilienceRuntime remains the sole production mutation authority.

## Phase 79–85 summary

Phases 79–82 establish the intent model, API ingestion boundary, pure compilation to CompiledIntent, and intent-scoped admission/enforcement without introducing a second control plane. Phases 83–85 formalize conflict resolution, safety/change governance, and observe-only drift assurance; downstream phases must consume these contracts. Fork advances include durable owner-scoped decision persistence and consistent ownership across all decision surfaces.

## Phase 71 certification prerequisites

The Phase 71 gate is limited to the release/distribution contract defined by `docs/phases/phase-71.md`. Remaining production certification (device smoke, regional validation, signing, security sign-off) is tracked in open issues and `docs/release/RELEASE_GATE_ROADMAP.md`.

## Canonical evidence locations

- Current state: this file.
- Release path and blockers: `docs/release/RELEASE_GATE_ROADMAP.md`.
- Current post-70 roadmap: `docs/roadmap/MASTER_ROADMAP_V2.md`.
- Historical 0–70 roadmap: `ROADMAP.md`.
- Current phase records: `docs/phases/`.
- Engineering governance: `docs/architecture/engineering-governance.md`.

## Product objective

IRP's long-term objective is a safe, observable and policy-governed Internet control plane that can continuously measure network conditions, diagnose failures, select and apply bounded changes, verify the result, recover from failure and explain decisions across supported clients and network providers.

## Architecture invariants (unchanged)

- ResilienceRuntime remains the canonical runtime authority.
- Never restore NetworkAutopilot as a parallel production control plane.
- No competing authorities for runtime state, policy, decisions, safety, mutation, execution, verification, recovery, intent, or orchestration.

## Autonomous engineer checkpoint (2026-10-22)

- Starting base SHA: `e5c6db1b8445d0e200cf066ce8a8e7da2ff46fb7`
- Completed this run: inspected live main tree confirming Phase 79-82 full implementations and Phase 83-85 contracts + partial/observe-only code (arbitration.ts, governance.ts, drift). Updated state documents to match current evidence. Opened PR.
- Branches/PRs: `chore/checkpoint-phase82-plus-20261022` (this PR).
- Actual CI: not re-run in this session; prior SHA had most workflows SUCCESS; Public Runtime Lab was pending (Release Gate BLOCKED). Re-check after merge.
- Verified merges: none this run (documentation-only).
- Blockers: exact-SHA Release Gate / Public Runtime Lab evidence (#323); remaining exact-SHA evidence for #13/#14; Phase 86+ implementation not started; Linux runtime soak (#254/#323).
- Next prioritized tasks: merge this state update; strengthen exact-SHA CI evidence for Phases 83-85 / #13; implement missing Phase 86+ contracts or continue Linux client wiring; do not declare any phase COMPLETE without evidence.
