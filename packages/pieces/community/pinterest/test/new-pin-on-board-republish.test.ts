import { Store } from '@activepieces/pieces-framework';
import { describe, expect, test } from 'vitest';
import { newPinOnBoard } from '../src/lib/triggers/new-pin-on-board';

describe('newPinOnBoard republish', () => {
  test('keeps the checkpoint and the pending page bookmark through onDisable and onEnable', async () => {
    const { store, data } = memoryStore({ lastPoll: 1000, pendingBookmark: 'page-11', pendingMaxEpoch: 2000 });

    await newPinOnBoard.onDisable(hookContext({ store, isRepublish: true }));
    await newPinOnBoard.onEnable(hookContext({ store, isRepublish: true }));

    expect(Object.fromEntries(data)).toEqual({ lastPoll: 1000, pendingBookmark: 'page-11', pendingMaxEpoch: 2000 });
  });

  test('starts fresh when the flow is turned off and on', async () => {
    const { store, data } = memoryStore({ lastPoll: 1000, pendingBookmark: 'page-11', pendingMaxEpoch: 2000 });

    await newPinOnBoard.onDisable(hookContext({ store }));
    await newPinOnBoard.onEnable(hookContext({ store }));

    expect(data.has('pendingBookmark')).toBe(false);
    expect(data.has('pendingMaxEpoch')).toBe(false);
    expect(data.get('lastPoll')).toBeGreaterThan(1000);
  });
});

function hookContext({ store, isRepublish }: { store: Store; isRepublish?: boolean }): Parameters<typeof newPinOnBoard.onEnable>[0] {
  return { store, isRepublish, auth: {}, propsValue: {} } as unknown as Parameters<typeof newPinOnBoard.onEnable>[0];
}

function memoryStore(initial: Record<string, unknown>): { store: Store; data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(initial));
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return (data.get(key) as T) ?? null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return { store, data };
}
