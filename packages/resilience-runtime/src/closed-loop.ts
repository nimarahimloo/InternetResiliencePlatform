import type { DecisionOutcome, DecisionRecord, RuntimeContext } from './domain/types.js';
import type { ResilienceRuntime } from './runtime.js';
import { detectIntentDrift, type IntentDriftResult } from './intent/drift.js';
import type { CompiledIntent } from './domain/types.js';

export type ClosedLoopStopReason = 'healthy' | 'max_cycles' | 'blocked' | 'failed' | 'aborted';

export interface ClosedLoopOptions extends Partial<RuntimeContext> {
  readonly maxCycles?: number;
  readonly intervalMs?: number;
  readonly stopWhenHealthy?: boolean;
  readonly signal?: AbortSignal;
  readonly context?: Partial<RuntimeContext>;
  readonly idempotencyKey?: string;
  readonly correlationId?: string;
  readonly driftInputs?: {
    readonly intent: CompiledIntent;
    readonly observed: Readonly<Record<string, unknown>>;
    readonly at?: Date;
  };
}

export interface ClosedLoopResult {
  readonly status: 'healthy' | 'bounded' | 'blocked' | 'failed' | 'aborted';
  readonly stopReason: ClosedLoopStopReason;
  readonly cyclesCompleted: number;
  readonly records: readonly DecisionRecord[];
  readonly driftAssessments?: readonly IntentDriftResult[];
}

export interface ClosedLoopRuntime {
  cycle(input: Partial<RuntimeContext> & { idempotencyKey?: string }): Promise<DecisionRecord>;
}

const DEFAULT_MAX_CYCLES = 1;
const MAX_ALLOWED_CYCLES = 10;
const DEFAULT_INTERVAL_MS = 0;

const terminalHealthyOutcomes = new Set<DecisionOutcome>([
  'success',
  'recovered',
  'noop',
  'simulated',
]);

const assertIntegerInRange = (value: number, name: string, min: number, max: number): void => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
  }
};

const assertNonNegativeInteger = (value: number, name: string): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
};

const sleep = async (milliseconds: number, signal?: AbortSignal): Promise<void> => {
  if (milliseconds === 0) return;
  if (signal?.aborted) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
};

const collectDriftAssessment = (options: ClosedLoopOptions, at?: Date): IntentDriftResult | undefined => {
  if (!options.driftInputs) return undefined;
  const { intent, observed, at: fixedAt } = options.driftInputs;
  return detectIntentDrift(intent, observed, fixedAt ?? at);
};

export class BoundedClosedLoopController {
  constructor(private readonly runtime: ClosedLoopRuntime | Pick<ResilienceRuntime, 'cycle'>) {}

  async run(options: ClosedLoopOptions = {}): Promise<ClosedLoopResult> {
    const maxCycles = options.maxCycles ?? DEFAULT_MAX_CYCLES;
    const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    const stopWhenHealthy = options.stopWhenHealthy ?? true;
    const signal = options.signal;
    const driftAssessments: IntentDriftResult[] = [];

    assertIntegerInRange(maxCycles, 'maxCycles', 1, MAX_ALLOWED_CYCLES);
    assertNonNegativeInteger(intervalMs, 'intervalMs');

    const records: DecisionRecord[] = [];
    const baseCorrelationId = options.correlationId ?? options.context?.correlationId ?? 'closed-loop';
    const baseIdempotencyKey = options.idempotencyKey ?? baseCorrelationId;
    const runtimeContextOverrides: Partial<RuntimeContext> = { ...(options.context ?? {}) };
    for (const key of ['runtimeId', 'mode', 'deadline', 'cancelled', 'securityContext', 'policySnapshot', 'capabilitySnapshot', 'observationSnapshot', 'configuration', 'correlationId'] as const) {
      const value = options[key];
      if (value !== undefined) {
        (runtimeContextOverrides as Record<string, unknown>)[key] = value;
      }
    }

    const withDrift = (result: Omit<ClosedLoopResult, 'driftAssessments'>): ClosedLoopResult =>
      driftAssessments.length > 0 ? { ...result, driftAssessments } : result;

    for (let cycleNumber = 1; cycleNumber <= maxCycles; cycleNumber += 1) {
      if (signal?.aborted) {
        return withDrift({ status: 'aborted', stopReason: 'aborted', cyclesCompleted: records.length, records });
      }

      await sleep(cycleNumber === 1 ? 0 : intervalMs, signal);
      if (signal?.aborted) {
        return withDrift({ status: 'aborted', stopReason: 'aborted', cyclesCompleted: records.length, records });
      }

      let record: DecisionRecord;
      try {
        record = await this.runtime.cycle({
          ...runtimeContextOverrides,
          correlationId: `${baseCorrelationId}/cycle-${cycleNumber}`,
          idempotencyKey: `${baseIdempotencyKey}/cycle-${cycleNumber}`,
        });
      } catch (error) {
        if (signal?.aborted) {
          return withDrift({ status: 'aborted', stopReason: 'aborted', cyclesCompleted: records.length, records });
        }
        throw error;
      }

      records.push(record);

      const assessment = collectDriftAssessment(options, new Date());
      if (assessment) {
        driftAssessments.push(assessment);
      }

      if (stopWhenHealthy && terminalHealthyOutcomes.has(record.outcome)) {
        return withDrift({ status: 'healthy', stopReason: 'healthy', cyclesCompleted: records.length, records });
      }

      if (record.outcome === 'blocked') {
        return withDrift({ status: 'blocked', stopReason: 'blocked', cyclesCompleted: records.length, records });
      }

      if (record.outcome === 'failed') {
        return withDrift({ status: 'failed', stopReason: 'failed', cyclesCompleted: records.length, records });
      }
    }

    return withDrift({ status: 'bounded', stopReason: 'max_cycles', cyclesCompleted: records.length, records });
  }
}
