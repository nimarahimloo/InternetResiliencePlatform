# InternetResiliencePlatform — Canonical Project State

> Authoritative handoff point for continuing development from any account, agent, or future session.

## Current implementation gate

- **Current implementation baseline:** Phase 83 — Policy Conflict Resolution has arbitration implementation on `main` (intent arbitration, conflict detection, ordered effective intents). Disposition remains PARTIAL pending full durable journal e2e evidence.
- **Current main HEAD (2026-10-23):** pending this PR merge (branch from latest fork main).
- **Issue #12 progress:** Evidence register and phase-history matrix contain package/path/test anchors for Phases 1–38. Historical test-count TSV is not fresh per-phase CI evidence; all these phases remain PARTIAL pending acceptance-criterion review and current-SHA verification. Remaining Phase 39–78 mappings and exact-SHA verification still need reconciliation. Issue #12 remains open.
- **Current open issues (authoritative tracker):** #254 (Linux Client runtime wiring), #272 (EPIC: Autonomous Network Superplatform — Full-System Reconstruction & Completion), #284 (Workstream: Full Verification, CI/CD, Deployment & Final Evidence), #323 (Final External Validation Gate — Remote CI, Linux Runtime Soak & Release Evidence). Additional fork trackers #4/#12/#13/#14 cover certification, evidence reconstruction and intent/policy gaps.
- **Phase 77 status:** implementation is complete and merged on `main`; the safety/rollback/recovery kernel is available from `@irp/resilience-runtime`.
- **Phase 78 status:** the bounded closed-loop controller is implemented and present on `main`, optionally collecting observe-only Phase 85 drift assessments.
- **Phase 79 status:** NetworkIntent model, lifecycle transitions, effective-window evaluation, autonomy levels and dedicated tests are implemented and present on `main` in `packages/core/src/intent.ts` and `intent.test.ts`. Exported from the core barrel.
- **Phase 80 status:** Intent API & Ingestion is implemented on `main` in `apps/api/src/intent-api.ts` (authenticated routes for create/list/get/commands, Idempotency-Key, in-memory and database stores, ownership isolation via `ownershipOf` / `ownershipKey`). Routes registered from the API entrypoint. Tests present. No network mutation from the API boundary.
- **Phase 81 status:** Intent Translation / Compilation is implemented on `main` in `packages/resilience-runtime/src/intent/compiler.ts` (`compileNetworkIntent`, `isCompiledIntentEffective`). Pure, deterministic, side-effect free. Tests present.
- **Phase 82 status:** Intent-scoped Policy Decision & Enforcement is implemented on `main` via `packages/resilience-runtime/src/intent/governance.ts` (`resolveIntentGovernance`, `selectGovernedIntents`) and autonomy gates. Admission decisions, stale rejection, mode-gated `mutationAllowed`. Tests present. Broader declarative policy language remains later roadmap work.
- **Phase 83 status:** Policy Conflict Resolution implementation present in `arbitration.ts` (arbitrateIntents, InMemoryIntentStore, PostgresIntentStore). Dedicated unit tests added covering no-conflict, priority supersession, version supersession, stale exclusion and store recording. Scopes overlap now requires matching key+value. Disposition PARTIAL pending CI evidence on current SHA.
- **Phase 84 status:** Safety Constraints & Change Governance contract formalized; safety kernel and intent governance present. Regression coverage strengthened with blast-radius and admission matrix tests. Disposition PARTIAL pending exact-SHA CI.
- **Phase 85 status:** Intent Assurance & Drift Management observe-only detector implemented in `drift.ts`. Additional edge-case tests for non-numeric and missing keys added. Disposition PARTIAL pending CI.
- **Release state:** GitHub Releases `v0.2.0` and `v0.2.1` are developer-preview/prerelease evidence, not production certification. Production certification remains open. Exact-SHA Release Gate evidence must be verified before any stronger release claim.
- **Phase 71 is a separate release-evidence gate:** it does not block architecture implementation in Phases 72–85, but it must not be represented as certified until its evidence exists.
- **Phases 86–150:** contracts for 79–92 exist; implementation for 86+ remains not started or partial. No new runtime authority introduced. ResilienceRuntime remains the sole production mutation authority.

## Phase 79–85 summary

Phases 79–85 establish the intent model, API ingestion, compilation, governance, conflict resolution, safety constraints, and observe-only drift detection without introducing a second control plane. Downstream phases must consume these contracts.

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

## Autonomous engineer checkpoint (2026-10-23)

- Starting base SHA: latest fork main (from previous checkpoint e09a558 or later)
- Ending base SHA: (pending this PR)
- Completed this run: added edge-case regression tests for detectIntentDrift (non-numeric observed values, missing keys) to prevent false drift signals. Updated PROJECT_STATE and Phase 85 status.
- Branches/PRs: phase/85-drift-edge-cases-20261023 (this PR)
- Actual CI: pending
- Verified merges: none this run
- Blockers: exact-SHA CI for new tests; durable conflict-journal restart coverage for #13; Linux runtime soak for #254/#323.
- Next prioritized tasks: durable conflict journal restart tests; Phase 86 connectivity fabric contracts; Linux client verification.
