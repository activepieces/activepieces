import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { signNowWebhook } from '../src/lib/common/webhook';

function memoryStore({ initial, failPut }: { initial?: Record<string, unknown>; failPut?: boolean }) {
  const data = new Map<string, unknown>(Object.entries(initial ?? {}));
  return {
    data,
    put: async <T>(key: string, value: T): Promise<T> => {
      if (failPut === true) {
        throw new Error('store down');
      }
      data.set(key, value);
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const value: unknown = data.get(key);
      return value === undefined ? null : narrow<T>({ value });
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

function narrow<T>({ value }: { value: unknown }): T {
  const holder: { v?: T } = {};
  Reflect.set(holder, 'v', value);
  return Reflect.get(holder, 'v');
}

function sign({ secret, raw }: { secret: string; raw: string }): string {
  return createHmac('sha256', secret).update(raw).digest('base64');
}

function stubFetch({ routes }: { routes: (args: { url: string; method: string }) => { status: number; body: unknown } }): string[] {
  const seen: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const method = init.method ?? 'GET';
      seen.push(`${method} ${url}`);
      const r = routes({ url, method });
      return new Response(JSON.stringify(r.body), { status: r.status });
    })
  );
  return seen;
}

const auth = { type: AppConnectionType.CUSTOM_AUTH, props: { apiKey: 'KEY' } };
const EVENT = 'user.document.complete';
const raw = JSON.stringify({
  meta: { timestamp: 1, event: EVENT, access_token: 'LEAKED', environment: 'https://api.signnow.com' },
  content: { document_id: 'd1', document_name: 'A', user_id: 'u1' },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('signature verification', () => {
  const store = () => memoryStore({ initial: { k: { subscriptionId: 's1', secretKey: 'sec' } } });

  test('valid signature is accepted and access_token is stripped', async () => {
    const events = await signNowWebhook.eventsFrom({
      payload: { body: JSON.parse(raw), rawBody: raw, headers: { 'X-SignNow-Signature': sign({ secret: 'sec', raw }) } },
      event: EVENT,
      store: store(),
      storeKey: 'k',
    });
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events[0])).not.toContain('LEAKED');
    expect(events[0]['content']).toEqual({ document_id: 'd1', document_name: 'A', user_id: 'u1' });
  });

  test('wrong signature is rejected', async () => {
    const events = await signNowWebhook.eventsFrom({
      payload: { body: JSON.parse(raw), rawBody: raw, headers: { 'x-signnow-signature': sign({ secret: 'other', raw }) } },
      event: EVENT,
      store: store(),
      storeKey: 'k',
    });
    expect(events).toEqual([]);
  });

  test('wrong-length signature is rejected', async () => {
    expect(signNowWebhook.isValidSignature({ secretKey: 'sec', rawBody: raw, signature: 'YWJj' })).toBe(false);
  });

  test('missing header is rejected', async () => {
    const events = await signNowWebhook.eventsFrom({ payload: { body: JSON.parse(raw), rawBody: raw, headers: {} }, event: EVENT, store: store(), storeKey: 'k' });
    expect(events).toEqual([]);
  });

  test('legacy subscription without a stored secret still accepts events', async () => {
    const events = await signNowWebhook.eventsFrom({
      payload: { body: JSON.parse(raw), rawBody: raw, headers: {} },
      event: EVENT,
      store: memoryStore({ initial: { k: 'legacy-sub' } }),
      storeKey: 'k',
    });
    expect(events).toHaveLength(1);
  });

  test('a different event name is ignored', async () => {
    const events = await signNowWebhook.eventsFrom({
      payload: { body: JSON.parse(raw), rawBody: raw, headers: { 'x-signnow-signature': sign({ secret: 'sec', raw }) } },
      event: 'user.document.delete',
      store: store(),
      storeKey: 'k',
    });
    expect(events).toEqual([]);
  });
});

describe('dedupe', () => {
  test('a replayed delivery is dropped and a new one passes', async () => {
    const s = memoryStore({ initial: { k: { subscriptionId: 's1', secretKey: 'sec' } } });
    const deliver = (body: string) =>
      signNowWebhook.eventsFrom({
        payload: { body: JSON.parse(body), rawBody: body, headers: { 'x-signnow-signature': sign({ secret: 'sec', raw: body }) } },
        event: EVENT,
        store: s,
        storeKey: 'k',
        now: 1000,
      });
    expect(await deliver(raw)).toHaveLength(1);
    expect(await deliver(raw)).toHaveLength(0);
    const other = raw.replace('"timestamp":1', '"timestamp":2');
    expect(await deliver(other)).toHaveLength(1);
  });
});

describe('enable / disable', () => {
  test('enable sends a secret_key and stores it with the subscription', async () => {
    const bodies: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.endsWith('/user')) {
          return new Response(JSON.stringify({ id: 'u1' }), { status: 200 });
        }
        bodies.push(JSON.parse(String(init.body)));
        return new Response(JSON.stringify({ data: { id: 'sub1' } }), { status: 201 });
      })
    );
    const s = memoryStore({});
    await signNowWebhook.enable({ auth, event: EVENT, webhookUrl: 'https://hook', store: s, storeKey: 'k' });
    const stored = s.data.get('k');
    expect(stored).toMatchObject({ subscriptionId: 'sub1' });
    expect(JSON.stringify(bodies[0])).toContain(Reflect.get(Object(stored), 'secretKey'));
    expect(bodies[0]).toMatchObject({ event: EVENT, entity_id: 'u1', attributes: { callback: 'https://hook' } });
  });

  test('enable deletes the subscription when store.put fails', async () => {
    const seen = stubFetch({
      routes: ({ url, method }) =>
        url.endsWith('/user') ? { status: 200, body: { id: 'u1' } } : method === 'POST' ? { status: 201, body: { data: { id: 'sub1' } } } : { status: 200, body: {} },
    });
    await expect(signNowWebhook.enable({ auth, event: EVENT, webhookUrl: 'https://hook', store: memoryStore({ failPut: true }), storeKey: 'k' })).rejects.toThrow(
      'store down'
    );
    expect(seen).toContain('DELETE https://api.signnow.com/v2/event-subscriptions/sub1');
  });

  test('disable treats 404 as already removed', async () => {
    stubFetch({ routes: () => ({ status: 404, body: { errors: [{ code: 404, message: 'not found' }] } }) });
    const s = memoryStore({ initial: { k: { subscriptionId: 'gone', secretKey: 'x' }, k_seen_events: [] } });
    await expect(signNowWebhook.disable({ auth, store: s, storeKey: 'k' })).resolves.toBeUndefined();
    expect(s.data.size).toBe(0);
  });

  test('disable surfaces other errors', async () => {
    stubFetch({ routes: () => ({ status: 500, body: { error: 'boom' } }) });
    const s = memoryStore({ initial: { k: 'legacy' } });
    await expect(signNowWebhook.disable({ auth, store: s, storeKey: 'k' })).rejects.toThrow(/HTTP 500/);
  });
});
