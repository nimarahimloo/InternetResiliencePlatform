# Phase 1–38 Acceptance Evidence Register

**Issue:** #12  
**Source SHA (this reconstruction batch):** `01cf1282cd89d9c7e2ba162b14a003d4b3e20251`  
**Scope of this batch:** Foundation track **Phases 1–7** fully mapped. Phases 8–38 remain pending reconstruction in subsequent batches.

> Documentation and path presence alone never yield COMPLETE. Dispositions in `phase-1-150-status-matrix.md` change only when `phase_matrix.py` is regenerated against evidence that resolves packages/paths and recorded passing tests.

## How to read a row

| Field | Meaning |
|-------|---------|
| Packages | Owning `@irp/*` packages at HEAD |
| Paths | Primary source paths |
| Tests | Test files or package test counts from `test-counts.tsv` |
| CI / recorded run | Test-count TSV from finalization evidence (not a live workflow URL in this batch) |
| History state | Target state in `phase-history-evidence-matrix.md` after this batch |

---

## Batch A — Foundation (Phases 1–7)

### Phase 1 — core infrastructure and lifecycle/config/logging contracts

| Field | Evidence |
|-------|----------|
| Packages | `@irp/core`, `@irp/config`, `@irp/logger`, `@irp/kernel` |
| Paths | `packages/core/src/index.ts`, `packages/config/src/index.ts`, `packages/logger/src/index.ts`, `packages/kernel/src/index.ts` |
| Tests | `@irp/core` 16 passed; `@irp/config` 2; `@irp/logger` 2; `@irp/kernel` 11 |
| Recorded run | `docs/audits/evidence/2026-10-12-finalization/test-counts.tsv` |
| History state | `mapped` |

### Phase 2 — quality, type, lint, test and validation baseline

| Field | Evidence |
|-------|----------|
| Packages | Workspace root tooling |
| Paths | `package.json`, `eslint.config.js`, `vitest.config.ts`, `tsconfig.base.json`, `scripts/`, `.github/workflows/` |
| Tests | Workspace validate/test gates; package vitest suites in `test-counts.tsv` |
| Recorded run | Same TSV; CI workflows under `.github/workflows/` |
| History state | `mapped` |

### Phase 3 — CI/CD reproducible build, verification, artifact pipelines

| Field | Evidence |
|-------|----------|
| Packages | N/A (workflow surface) |
| Paths | `.github/workflows/`, `Dockerfile`, `compose.yaml` |
| Tests | Workflow runs on `main`; finalization gates under `docs/audits/evidence/2026-10-12-finalization/gates/` |
| History state | `mapped` |

### Phase 4 — core architecture / shared types and domain contracts

| Field | Evidence |
|-------|----------|
| Packages | `@irp/types`, `@irp/shared`, `@irp/core` |
| Paths | `packages/types/src/index.ts`, `packages/shared/src/index.ts`, `packages/core/src/index.ts` |
| Tests | Package tests in `test-counts.tsv` |
| History state | `mapped` |

### Phase 5 — bounded shared scheduling/retry/cache/concurrency services

| Field | Evidence |
|-------|----------|
| Packages | `@irp/utils`, `@irp/kernel` |
| Paths | `packages/utils/src/index.ts`, `packages/kernel/src/index.ts`, `packages/kernel/src/timeout.test.ts` |
| Tests | `@irp/utils`, `@irp/kernel` tests |
| History state | `mapped` |

### Phase 6 — portable network primitives

| Field | Evidence |
|-------|----------|
| Packages | `@irp/network`, `@irp/connectivity` |
| Paths | `packages/network/src/index.ts`, `packages/connectivity/` |
| Tests | `@irp/network` 2; `@irp/connectivity` 13 |
| History state | `mapped` |

### Phase 7 — canonical bounded network measurements

| Field | Evidence |
|-------|----------|
| Packages | `@irp/metrics`, `@irp/network-intelligence`, `@irp/dns` |
| Paths | `packages/metrics/src/index.ts`, `packages/network-intelligence/`, `packages/dns/` |
| Tests | `@irp/metrics` 8; `@irp/network-intelligence` 41; `@irp/dns` 26 |
| History state | `mapped` |

---

## Batches not yet reconstructed (Phases 8–38)

| Track | Phases | Status |
|-------|--------|--------|
| Network intelligence | 8–18 | pending |
| Extensibility / access | 19–27 | pending |
| Learning / observability | 28–38 | pending |

## Regeneration

```bash
python3 docs/audits/evidence/2026-10-12-finalization/phase_matrix.py
```
