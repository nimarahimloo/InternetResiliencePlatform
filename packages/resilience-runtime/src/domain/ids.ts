import { randomUUID } from 'node:crypto';
let sequence = 0;
export const stableId = (prefix: string, seed: string) =>
  `${prefix}-${Buffer.from(seed).toString('hex').slice(0, 24)}`;
export const nextId = (prefix: string) => `${prefix}-${(++sequence).toString().padStart(6, '0')}`;
/**
 * Identifier that stays unique across process restarts and multiple instances.
 * `nextId` is a process-local counter, so it must not be used as a durable key:
 * after a restart it would reissue ids that already exist in a persistent store.
 */
const processNonce = randomUUID().slice(0, 8);
export const nextUniqueId = (prefix: string) =>
  `${prefix}-${processNonce}-${(++sequence).toString().padStart(6, '0')}`;
export const nowIso = () => new Date().toISOString();
export const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
  }
  return value;
};
