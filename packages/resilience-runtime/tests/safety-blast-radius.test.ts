import { describe, expect, it } from 'vitest';
import { SafetyRollbackRecoveryKernel } from '../src/safety/safety-kernel.js';
import { createRuntimeContext } from '../src/context/context.js';
import type { ActionPlan, CandidateAction } from '../src/domain/types.js';

const noopEvents = {
  async emit() {
    /* no-op */
  },
};

const noopRecovery = {
  async recover() {
    return {
      id: 'recovery-1',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      correlationId: 'test',
      source: 'test',
      metadata: {},
      delegatedTo: 'failover' as const,
      status: 'not_required' as const,
      reason: 'test',
    };
  },
};

const baseAction = (intent: CandidateAction['intent'] = 'route_change'): CandidateAction => ({
  id: 'action-1',
  schemaVersion: 1,
  createdAt: new Date().toISOString(),
  correlationId: 'test',
  source: 'test',
  metadata: {},
  intent,
  expectedBenefit: 0.8,
  risk: 0.3,
  confidence: 0.9,
  requiredCapabilities: [],
  dependencies: [],
  postconditions: [],
  verificationRequirements: [],
  rejectionReasons: [],
});

const basePlan = (overrides: Partial<ActionPlan> = {}): ActionPlan => ({
  id: 'plan-1',
  schemaVersion: 1,
  createdAt: new Date().toISOString(),
  correlationId: 'test',
  source: 'test',
  metadata: {},
  selectedAction: baseAction(),
  alternatives: [],
  rejectionReasons: [],
  expectedBenefit: 0.8,
  risk: 0.3,
  confidence: 0.9,
  policyResult: { allowed: true, reasons: [], requiredCapabilities: [] },
  requiredCapabilities: [],
  dependencies: [],
  expectedPostconditions: [],
  verificationRequirements: [],
  ...overrides,
});

describe('SafetyRollbackRecoveryKernel blast radius', () => {
  const kernel = new SafetyRollbackRecoveryKernel(noopEvents, noopRecovery, {
    maxBlastRadius: 0.75,
  });

  it('rejects a plan whose blast radius exceeds the configured maximum', () => {
    const context = createRuntimeContext({
      mode: 'live',
      securityContext: { trusted: true },
      capabilitySnapshot: {
        ...createRuntimeContext({ mode: 'live' }).capabilitySnapshot,
        trusted: true,
      },
    });
    const plan = basePlan({
      risk: 0.9,
      metadata: { blastRadius: 0.9 },
    });

    const assessment = kernel.assess(plan, context);

    expect(assessment.allowed).toBe(false);
    expect(assessment.blastRadius).toBe(0.9);
    expect(assessment.reasons.some((r) => r.includes('blast radius') && r.includes('exceeds'))).toBe(
      true,
    );
  });

  it('accepts a plan whose blast radius is within the limit', () => {
    const context = createRuntimeContext({
      mode: 'live',
      securityContext: { trusted: true },
      capabilitySnapshot: {
        ...createRuntimeContext({ mode: 'live' }).capabilitySnapshot,
        trusted: true,
      },
    });
    const plan = basePlan({
      risk: 0.4,
      metadata: { blastRadius: 0.4 },
    });

    const assessment = kernel.assess(plan, context);

    expect(assessment.allowed).toBe(true);
    expect(assessment.reasons).toEqual([]);
    expect(assessment.blastRadius).toBe(0.4);
  });

  it('falls back to plan.risk when no explicit blastRadius metadata is present', () => {
    const context = createRuntimeContext({
      mode: 'live',
      securityContext: { trusted: true },
      capabilitySnapshot: {
        ...createRuntimeContext({ mode: 'live' }).capabilitySnapshot,
        trusted: true,
      },
    });
    const plan = basePlan({ risk: 0.8 });

    const assessment = kernel.assess(plan, context);

    expect(assessment.allowed).toBe(false);
    expect(assessment.blastRadius).toBe(0.8);
  });
});
