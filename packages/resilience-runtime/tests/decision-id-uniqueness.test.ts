import { describe, expect, it, vi } from 'vitest';

describe('decision identifiers', () => {
  it('stay unique across a simulated process restart, unlike the process-local counter', async () => {
    vi.resetModules();
    const first = await import('../src/domain/ids.js');
    const beforeRestart = [first.nextUniqueId('decision'), first.nextUniqueId('decision')];
    const counterBeforeRestart = first.nextId('decision');

    // A restart re-evaluates the module: sequence restarts and a new nonce is drawn.
    vi.resetModules();
    const second = await import('../src/domain/ids.js');
    const afterRestart = [second.nextUniqueId('decision'), second.nextUniqueId('decision')];
    const counterAfterRestart = second.nextId('decision');

    // The old counter collides after a restart, which is exactly why it is not a durable key.
    expect(counterAfterRestart).toBe(counterBeforeRestart);
    // The unique generator never reissues an id that a previous process already used.
    expect(new Set([...beforeRestart, ...afterRestart]).size).toBe(4);
    expect(beforeRestart[0]).toMatch(/^decision-[0-9a-f]{8}-\d{6}$/);
  });
});
