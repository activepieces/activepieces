import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { newEventTrigger } from '../src/lib/triggers/new-event';

afterEach(() => vi.restoreAllMocks());

const WEBHOOK_URL = 'https://ap.example.com/hook';

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    get: async (key: string) => data.get(key) ?? null,
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function stubOkta({ existingHooks, verifyFails = false }: { existingHooks: unknown[]; verifyFails?: boolean }) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    const path = new URL(request.url).pathname.replace('/api/v1', '');
    calls.push({ method: request.method, path, body: request.body });
    if (verifyFails && path.endsWith('/lifecycle/verify')) {
      throw new Error('verification failed');
    }
    const body =
      request.method === 'GET'
        ? existingHooks
        : request.method === 'POST' && path === '/eventHooks'
          ? { id: 'hook-new' }
          : request.method === 'PUT'
            ? { id: path.split('/').pop() }
            : {};
    return { status: 200, headers: {}, body };
  });
  return calls;
}

function hookContext({ store, eventTypes }: { store: ReturnType<typeof memoryStore>; eventTypes: string[] }) {
  return {
    auth: { props: { domain: 'dev-1.okta.com', apiToken: 'token' } },
    propsValue: { eventTypes, hookName: 'Activepieces Webhook' },
    webhookUrl: WEBHOOK_URL,
    store,
  };
}

describe('new_event trigger', () => {
  test('turning the flow off deactivates and deletes the hook it created', async () => {
    const store = memoryStore();
    const calls = stubOkta({ existingHooks: [] });

    await newEventTrigger.onEnable(hookContext({ store, eventTypes: ['user.lifecycle.create'] }));
    expect(store.data.get('hookId')).toBe('hook-new');

    calls.length = 0;
    await newEventTrigger.onDisable(hookContext({ store, eventTypes: ['user.lifecycle.create'] }));
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /eventHooks/hook-new/lifecycle/deactivate',
      'DELETE /eventHooks/hook-new',
    ]);
    expect(store.data.has('hookId')).toBe(false);
  });

  test('a reused hook gets the current event types and is removed on disable', async () => {
    const store = memoryStore();
    const calls = stubOkta({
      existingHooks: [{ id: 'hook-old', name: 'Activepieces Webhook', channel: { config: { uri: WEBHOOK_URL } } }],
    });

    await newEventTrigger.onEnable(hookContext({ store, eventTypes: ['group.lifecycle.create'] }));
    const put = calls.find((c) => c.method === 'PUT');
    expect(put?.path).toBe('/eventHooks/hook-old');
    expect(put?.body).toMatchObject({ events: { items: ['group.lifecycle.create'] } });
    expect(calls.some((c) => c.method === 'POST' && c.path === '/eventHooks')).toBe(false);
    expect(store.data.get('hookId')).toBe('hook-old');

    calls.length = 0;
    await newEventTrigger.onDisable(hookContext({ store, eventTypes: ['group.lifecycle.create'] }));
    expect(calls.map((c) => `${c.method} ${c.path}`)).toContain('DELETE /eventHooks/hook-old');
  });

  test('a hook whose verification fails is removed before onEnable rejects', async () => {
    const store = memoryStore();
    const calls = stubOkta({ existingHooks: [], verifyFails: true });

    await expect(
      newEventTrigger.onEnable(hookContext({ store, eventTypes: ['user.lifecycle.create'] }))
    ).rejects.toThrow('verification failed');
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'GET /eventHooks',
      'POST /eventHooks',
      'POST /eventHooks/hook-new/lifecycle/verify',
      'POST /eventHooks/hook-new/lifecycle/deactivate',
      'DELETE /eventHooks/hook-new',
    ]);
    expect(store.data.has('hookId')).toBe(false);
  });
});
