import { isIntentEffective, type NetworkIntent } from '@irp/core';
import type { ResilienceRuntime } from '@irp/resilience-runtime';
import type { IntentApiStore, IntentOwnership } from './intent-api.js';

const DEFAULT_MAX_ACTIVE_INTENTS_PER_OWNER = 100;

export interface OwnerScopedIntentActivatorOptions {
  readonly store: Pick<IntentApiStore, 'list'>;
  readonly runtime: Pick<ResilienceRuntime, 'runIntents'>;
  readonly maxActiveIntentsPerOwner?: number;
  /**
   * Optional durable ownership link for the resulting runtime decision. Failure
   * to record the link never fails the handoff: the runtime decision itself is
   * already the authority, this only makes it reloadable under its owner.
   */
  readonly decisionOwners?: {
    attachOwner(decisionId: string, owner: IntentOwnership): Promise<unknown>;
  };
}

/**
 * Build the activation handoff from the durable, owner-scoped API intent store
 * to the canonical runtime. Never use the unscoped compiled-intent Postgres
 * store as the source for a shared multi-tenant API runtime.
 */
export const createOwnerScopedIntentActivator = ({
  store,
  runtime,
  maxActiveIntentsPerOwner = DEFAULT_MAX_ACTIVE_INTENTS_PER_OWNER,
  decisionOwners,
}: OwnerScopedIntentActivatorOptions) => {
  if (!Number.isInteger(maxActiveIntentsPerOwner) || maxActiveIntentsPerOwner < 1) {
    throw new RangeError('maxActiveIntentsPerOwner must be a positive integer');
  }

  return async (
    activatedIntent: NetworkIntent,
    owner: IntentOwnership,
  ): Promise<Awaited<ReturnType<ResilienceRuntime['runIntents']>>> => {
    // Fetch one extra row to detect truncation. Partial arbitration could miss a
    // higher-priority conflict, so exceeding the bound must fail closed.
    const activeIntents = await store.list('active', owner, maxActiveIntentsPerOwner + 1);
    if (activeIntents.length > maxActiveIntentsPerOwner) {
      throw new Error(
        `Owner has more than ${maxActiveIntentsPerOwner} active intents; refusing partial runtime arbitration`,
      );
    }

    // Active status alone is not proof of an effective intent. Expired or
    // future-dated entries must not be compiled into an executable runtime input.
    const effectiveIntents = activeIntents.filter((intent) => isIntentEffective(intent));
    if (
      !effectiveIntents.some(
        (intent) => intent.id === activatedIntent.id && intent.version === activatedIntent.version,
      )
    ) {
      throw new Error(
        `Activated intent ${activatedIntent.id}@${activatedIntent.version} was not present in the effective owner-scoped store`,
      );
    }

    const record = await runtime.runIntents(effectiveIntents, {
      mode: 'simulation',
      correlationId: `intent-${activatedIntent.id}-v${activatedIntent.version}`,
      idempotencyKey: `intent-${activatedIntent.id}-v${activatedIntent.version}`,
    });
    if (decisionOwners && record?.decisionId) {
      try {
        await decisionOwners.attachOwner(record.decisionId, owner);
      } catch {
        // Ownership link is best-effort durability; the decision already exists.
      }
    }
    return record;
  };
};
