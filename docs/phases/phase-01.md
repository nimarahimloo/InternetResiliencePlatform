# Phase 1 — Core infrastructure and lifecycle/config/logging contracts

## Status

**Evidence reconstruction in progress (issue #12).** Canonical packages and tests exist on `main` (HEAD `b25d02bcc877ed6d2ccdeb3f8f347fae55e8cbe3`). Disposition remains PARTIAL until the phase-history evidence matrix is updated with explicit mappings and fresh CI evidence is attached.

## Objective

Establish the foundational TypeScript monorepo contracts for lifecycle management, configuration loading, and structured logging that later phases depend on.

## Canonical owners

- `@irp/core` — domain primitives and lifecycle helpers (`packages/core/src/`)
- `@irp/config` — configuration loading and validation (`packages/config/src/`)
- `@irp/logger` — structured logging (`packages/logger/src/`)

## Evidence anchors

- Package tests: `packages/core/src/index.test.ts`, `packages/config` tests, `packages/logger` tests
- CI: recorded green runs on prior HEADs (see `docs/audits/evidence/2026-10-12-finalization/test-counts.tsv`)
- Roadmap contract: `docs/architecture/product-roadmap-70-phases.md` Phase 1

## Acceptance criteria (historical contract)

- Core lifecycle, config and logging contracts are defined and exported.
- Unit tests cover the public surface.
- Repository validation, typecheck, lint and tests pass.

## Verification boundary

Source and historical test-count evidence exist. Full per-phase acceptance record mapping commits + tests + CI to this contract is being reconstructed. Do not promote to COMPLETE from this document alone.

## Rollback

Revert the packages; no downstream phase depends exclusively on these contracts for the current runtime path.
