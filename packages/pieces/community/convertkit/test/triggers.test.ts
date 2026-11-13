/// <reference types="vitest/globals" />

import { subscriberActivated } from '../src/lib/triggers';
import { AUTH, call, mockKit } from './helpers';

afterEach(() => vi.restoreAllMocks());

function memoryStore({ failPut = false }: { failPut?: boolean } = {}) {
  const data = new Map<string, unknown>();
  return {
    data,
    put: vi.fn(async (key: string, value: unknown) => {
      if (failPut) {
        throw new Error('store unavailable');
      }
      data.set(key, value);
      return value;
    }),
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    delete: vi.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

const KEY = '_webhook_subscriber_activated';
const lifecycle = ({ method, store }: { method: 'onEnable' | 'onDisable'; store: ReturnType<typeof memoryStore> }) =>
  call({
    target: subscriberActivated,
    method,
    context: { auth: AUTH, propsValue: {}, webhookUrl: 'https://cloud.example/webhooks/1', store },
  });

describe('webhook trigger lifecycle', () => {
  test('onEnable creates the Kit rule and stores its ID', async () => {
    const { requests } = mockKit([{ body: { rule: { id: 55 } } }]);
    const store = memoryStore();
    await lifecycle({ method: 'onEnable', store });
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://api.convertkit.com/v3/automations/hooks',
      body: { event: { name: 'subscriber.subscriber_activate' }, target_url: 'https://cloud.example/webhooks/1' },
    });
    expect(store.data.get(KEY)).toEqual({ ruleId: 55 });
  });

  test('onEnable deletes the rule it created when saving its ID fails', async () => {
    const { requests } = mockKit([{ body: { rule: { id: 56 } } }, { body: { success: true } }]);
    const store = memoryStore({ failPut: true });
    await expect(lifecycle({ method: 'onEnable', store })).rejects.toThrow('so it was removed again');
    expect(requests[1]).toMatchObject({ method: 'DELETE', url: 'https://api.convertkit.com/v3/automations/hooks/56' });
  });

  test('onDisable deletes the rule and then forgets its ID', async () => {
    const { requests } = mockKit([{ body: { success: true } }]);
    const store = memoryStore();
    store.data.set(KEY, { ruleId: 57 });
    await lifecycle({ method: 'onDisable', store });
    expect(requests[0]).toMatchObject({ method: 'DELETE', url: 'https://api.convertkit.com/v3/automations/hooks/57' });
    expect(store.data.has(KEY)).toBe(false);
  });

  test('onDisable treats a 404 as already deleted', async () => {
    mockKit([{ error: { status: 404, body: { error: 'Not Found' } } }]);
    const store = memoryStore();
    store.data.set(KEY, { ruleId: 58 });
    await lifecycle({ method: 'onDisable', store });
    expect(store.data.has(KEY)).toBe(false);
  });

  test('onDisable keeps the ID when Kit fails, so a retry can still delete the rule', async () => {
    mockKit([{ error: { status: 500, body: { error: 'boom' } } }]);
    const store = memoryStore();
    store.data.set(KEY, { ruleId: 59 });
    await expect(lifecycle({ method: 'onDisable', store })).rejects.toThrow('Kit API request failed (500)');
    expect(store.data.get(KEY)).toEqual({ ruleId: 59 });
  });
});
