import { createNetworkIntent, transitionIntent, type NetworkIntent } from '@irp/core';
import { describe, expect, it } from 'vitest';
import {
  InMemoryIntentStore,
  type IntentOwnership,
} from './intent-api.js';
import { createOwnerScopedIntentActivator } from './intent-runtime-handoff.js';
import type { ResilienceRuntime } from '@irp/resilience-runtime';

const ownerA: IntentOwnership = { principalId: 'principal-a' };
const ownerB: IntentOwnership = { principalId: 'principal-b' };

const activeIntent = (id: string, outcome = 'maintain stable access'): NetworkIntent =>
  transitionIntent(
    createNetworkIntent({
      id,
      priority: 'normal',
      spec: { outcome, target: { destination: 'github.com' } },
    }),
    { type: 'activate' },
  );

const runtimeStub = () => {
  const calls: { ids: string[]; input: Parameters<ResilienceRuntime['runIntents']>[1] }[] = [];
  const runtime: Pick<ResilienceRuntime, 'runIntents'> = {
    async runIntents(intents, input) {
      calls.push({ ids: intents.map((intent) => intent.id), input });
      return {} as Awaited<ReturnType<ResilienceRuntime['runIntents']>>;
    },
  };
  return { runtime, calls };
};

describe('owner-scoped intent runtime handoff', () => {
  it('passes the owner's full effective active set without mixing other owners', async () => {
    const store = new InMemoryIntentStore();
    const a1 = activeIntent('owner-a-1');
    const a2 = activeIntent('owner-a-2', 'prefer lower latency');
    const b1 = activeIntent('owner-b-1', 'prefer higher reliability');
    await store.put(a1, ownerA);
    await store.put(a2, ownerA);
    await store.put(b1, ownerB);

    const fake = runtimeStub();
    const activate = createOwnerScopedIntentActivator({ store, runtime: fake.runtime });

    await activate(a2, ownerA);
    await activate(b1, ownerB);

    expect(fake.calls).toHaveLength(2);
    expect(fake.calls[0]?.ids.sort()).toEqual(['owner-a-1', 'owner-a-2']);
    expect(fake.calls[0]?.input).toMatchObject({
      mode: 'simulation',
      correlationId: 'intent-owner-a-2-v2',
      idempotencyKey: 'intent-owner-a-2-v2',
    });
    expect(fake.calls[1]?.ids).toEqual(['owner-b-1']);
    expect(fake.calls[1]?.ids).not.toContain('owner-a-1');
    expect(fake.calls[1]?.ids).not.toContain('owner-a-2');
  });

  it('fails closed instead of silently arbitrating a truncated active set', async () => {
    const store = new InMemoryIntentStore();
    const active = [activeIntent('bound-1'), activeIntent('bound-2'), activeIntent('bound-3')];
    for (const intent of active) await store.put(intent, ownerA);
    const fake = runtimeStub();
    const activate = createOwnerScopedIntentActivator({
      store,
      runtime: fake.runtime,
      maxActiveIntentsPerOwner: 2,
    });

    await expect(activate(active[2]!, ownerA)).rejects.toThrow('refusing partial runtime arbitration');
    expect(fake.calls).toHaveLength(0);
  });

  it('does not pass an expired active record to the runtime', async () => {
    const store = new InMemoryIntentStore();
    const expired = {
      ...activeIntent('expired-active'),
      expiresAt: '2020-01-01T00:00:00.000Z',
    } as NetworkIntent;
    await store.put(expired, ownerA);
    const fake = runtimeStub();
    const activate = createOwnerScopedIntentActivator({ store, runtime: fake.runtime });

    await expect(activate(expired, ownerA)).rejects.toThrow('not present in the effective owner-scoped store');
    expect(fake.calls).toHaveLength(0);
  });
});
