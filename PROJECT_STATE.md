# InternetResiliencePlatform — Canonical Project State

> Authoritative handoff point for continuing development from any account, agent, or future session.

## Current implementation gate

- **Current implementation baseline:** Phase 79 — Intent Model & Lifecycle is implemented on `main`. NetworkIntent model, lifecycle, effective-window semantics, autonomy levels and tests are present in `@irp/core`.
- **Current main HEAD (2026-10-21):** `00dfda1a1a8290b31de1d878e44c30a4f13bd64f` (post owner-scoped decision listing and durable runtime decisions).
- **Issue #12 progress:** Evidence register and phase-history matrix contain package/path/test anchors for Phases 1–38. Historical test-count TSV is not fresh per-phase CI evidence; all these phases remain PARTIAL pending acceptance-criterion review and current-SHA verification. Remaining Phase 39–78 mappings and exact-SHA verification still need reconciliation. Issue #12 remains open.
- **Current open issues (authoritative tracker):** #254 (Linux Client runtime wiring), #272 (EPIC: Autonomous Network Superplatform — Full-System Reconstruction & Completion), #284 (Workstream: Full Verification, CI/CD, Deployment & Final Evidence), #323 (Final External Validation Gate — Remote CI, Linux Runtime Soak & Release Evidence). Additional fork trackers #4/#12/#13/#14 cover certification, evidence reconstruction and intent/policy gaps.
- **Phase 77 status:** implementation is complete and merged on `main`; the safety/rollback/recovery kernel is available from `@irp/resilience-runtime`.
- **Phase 78 status:** the bounded closed-loop controller is implemented and present on `main`, optionally collecting observe-only Phase 85 drift assessments.
- **Phase 79 status:** NetworkIntent model, lifecycle transitions, effective-window evaluation, autonomy levels and dedicated tests are implemented and present on `main` in `packages/core/src/intent.ts` and `intent.test.ts`. Exported from the core barrel.
- **Issue #13 progress:** acceptance contracts for Phases 79–83 are merged. Recent work addressed intent scope arbitration, conflict ownership, trusted live context/autonomy, owner-scoped runtime handoff, and e2e coverage. The runtime decision produced by the owner-scoped handoff is now persisted to PostgreSQL (`RuntimeDecisionRecord`, optional `decisionStore` on `ResilienceRuntime`, local in-memory authority retained, durable failure counted as degraded) and reloaded under its owner scope; this is verified against a real PostgreSQL in `apps/api/src/intent-api.postgres.integration.test.ts`. The legacy `/api/v1/autopilot/runs` and `/api/v1/autopilot/runs/:id` listing surfaces now use `DatabaseDecisionStore.listByOwner` when a durable store is present (falling back to the in-memory authority otherwise), so owner-scoped decision retrieval is available. A follow-up hardened this: every decision surface (`/autopilot/runs`, `/autopilot/runs/:id`, `/autopilot/actions`, `/runtime/decisions`, `/runtime/decisions/:id/explanation`) now resolves the same owner scope as the intent handoff (organization first, then principal), `POST /autopilot/runs` links its decision to the caller, and decision ids are unique across restarts (`nextUniqueId`; the process-local counter would reissue persisted ids after a restart and the durable insert would silently drop the new decision). Remaining gaps: exact-SHA CI evidence for this path and broader stale compiled-intent fail-closed evidence. In-memory or mocked-only evidence is insufficient; keep Issue #13 open.
- **Release state:** GitHub Releases `v0.2.0` and `v0.2.1` are developer-preview/prerelease evidence, not production certification. Production certification remains open. Exact-SHA Release Gate evidence must be verified before any stronger release claim. On SHA `00dfda1a1a8290b31de1d878e44c30a4f13bd64f` the Release Gate is FAIL/BLOCKED because Public Runtime Lab is still pending (all other required workflows SUCCESS).
- **Phase 71 is a separate release-evidence gate:** it does not block architecture implementation in Phases 72–79, but it must not be represented as certified until its evidence exists.
- **Phases 80–150:** contracts for 79–92 exist; Phase 93 contract formalized on fork. Implementation for 80+ remains partial or not started. No new runtime authority introduced. ResilienceRuntime remains the sole production mutation authority.

## Phase 79 objective

Phase 79 defines the canonical, typed network-intent model and deterministic lifecycle. An intent expresses a desired network outcome without embedding policy evaluation, planning or low-level execution details. The model is in `@irp/core` and must not become a parallel control plane.

## Current Phase 79 implementation

- `packages/core/src/intent.ts` provides `NetworkIntent`, `createNetworkIntent`, `transitionIntent`, `isIntentEffective`, `isIntentTerminal`, `isAutonomyPermitted`.
- Lifecycle transitions are explicit and fail-closed.
- Effective window uses half-open `[effectiveFrom, expiresAt)` semantics.
- Autonomy levels and objective weights are validated.
- Dedicated tests in `packages/core/src/intent.test.ts`.
- Public exports from `packages/core/src/index.ts`.

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

## Autonomous engineer checkpoint (2026-10-21)

- Starting/ending base SHA: `00dfda1a1a8290b31de1d878e44c30a4f13bd64f`
- Completed this run: inspected state, confirmed CI success on all required workflows except pending Public Runtime Lab (run 39531334675); Release Gate therefore BLOCKED/FAIL until that completes and re-evaluates.
- No branches/PRs opened prior to this checkpoint PR.
- Actual CI: CI, System Assurance, Linux Primary Device, Runtime Lab, CodeQL, Repository Deep Audit, Android/iOS/macOS/Windows clients all SUCCESS; Public Runtime Lab pending.
- Verified merges: recent #82/#83/#84 for issue #13 durable/owner-scoped decisions.
- Blockers: Public Runtime Lab completion for Release Gate; remaining exact-SHA evidence for #13; Phase 93+ implementation not started.
- Next prioritized tasks: await lab + re-check gate; formalize next phase contract (e.g. Phase 94) or strengthen stale-intent fail-closed tests; continue issue #14.
