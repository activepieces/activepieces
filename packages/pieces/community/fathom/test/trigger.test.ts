import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newRecording } from '../src/lib/triggers/new-recording';
import { fathomWebhook } from '../src/lib/common/webhook';
import { installFetch, jsonResponse, meeting, memoryStore, oauthAuth, requestOf } from './helpers';

const SECRET = `whsec_${Buffer.from('fathom-test-secret-key-32-bytes!!').toString('base64')}`;
const DEFAULT_PROPS = {
  triggered_for: ['my_recordings'],
  include_transcript: false,
  include_summary: true,
  include_action_items: false,
  include_crm_matches: false,
};

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function context({ store, propsValue = DEFAULT_PROPS, payload }: { store: ReturnType<typeof memoryStore>['store']; propsValue?: Record<string, unknown>; payload?: unknown }) {
  return { auth: oauthAuth(), propsValue, store, webhookUrl: 'https://cloud.example.com/v1/webhooks/flow1', payload };
}

function call<T>({ fn, ctx }: { fn: (ctx: never) => Promise<T>; ctx: unknown }): Promise<T> {
  return Reflect.apply(fn, newRecording, [ctx]);
}

function signedPayload({ id = 'msg_1', ts = Math.floor(Date.now() / 1000), body = JSON.stringify(meeting({})), secret = SECRET }: { id?: string; ts?: number; body?: string; secret?: string }) {
  return {
    body: JSON.parse(body),
    rawBody: body,
    headers: { 'Webhook-Id': id, 'Webhook-Timestamp': String(ts), 'Webhook-Signature': `v0,abc ${fathomWebhook.sign({ secret, webhookId: id, timestamp: ts, body })}` },
  };
}

describe('newRecording props', () => {
  it('defaults Include Summary to true on new steps so Fathom accepts the webhook', () => {
    expect(newRecording.props.include_summary.defaultValue).toBe(true);
  });
});

describe('onEnable / onDisable', () => {
  it('creates the webhook with the default settings and stores id and secret', async () => {
    const { store, data } = memoryStore();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { id: 'wh_1', secret: SECRET, url: 'x' } }));
    await call({ fn: newRecording.onEnable, ctx: context({ store }) });
    const req = requestOf({ fetchMock, call: 0 });
    expect(req.method).toBe('POST');
    expect(req.url).toBe('https://api.fathom.ai/external/v1/webhooks');
    expect(JSON.parse(String(req.body))).toEqual({
      destination_url: 'https://cloud.example.com/v1/webhooks/flow1',
      triggered_for: ['my_recordings'],
      include_transcript: false,
      include_summary: true,
      include_action_items: false,
      include_crm_matches: false,
    });
    expect(JSON.parse(data.get('_new_recording_webhook') ?? '{}')).toEqual({ webhookId: 'wh_1', secret: SECRET });
  });

  it('refuses all-false include flags before calling Fathom', async () => {
    const { store } = memoryStore();
    await expect(call({ fn: newRecording.onEnable, ctx: context({ store, propsValue: { ...DEFAULT_PROPS, include_summary: false } }) })).rejects.toThrow('at least one');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when Fathom rejects the create instead of looking enabled', async () => {
    const { store, data } = memoryStore();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { error: 'At least one include flag must be true' } }));
    await expect(call({ fn: newRecording.onEnable, ctx: context({ store }) })).rejects.toThrow('(400)');
    expect(data.size).toBe(0);
  });

  it('deletes the created webhook when storing it fails', async () => {
    const { store } = memoryStore();
    const failing = { ...store, put: async () => Promise.reject(new Error('store down')) };
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { id: 'wh_9', secret: SECRET } })).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(call({ fn: newRecording.onEnable, ctx: context({ store: failing }) })).rejects.toThrow('store down');
    const del = requestOf({ fetchMock, call: 1 });
    expect(del).toMatchObject({ method: 'DELETE', url: 'https://api.fathom.ai/external/v1/webhooks/wh_9' });
  });

  it('onDisable forgets the webhook on 204 and 404 but keeps it on other errors', async () => {
    const { store, data } = memoryStore();
    await store.put('_new_recording_webhook', { webhookId: 'wh_1', secret: SECRET });
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 500, body: { error: 'boom' } }));
    await expect(call({ fn: newRecording.onDisable, ctx: context({ store }) })).rejects.toThrow('500');
    expect(data.has('_new_recording_webhook')).toBe(true);
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, body: {} }));
    await call({ fn: newRecording.onDisable, ctx: context({ store }) });
    expect(data.has('_new_recording_webhook')).toBe(false);
  });
});

describe('run: signature and dedupe', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function enabledStore() {
    const holder = memoryStore();
    await holder.store.put('_new_recording_webhook', { webhookId: 'wh_1', secret: SECRET });
    return holder;
  }

  async function run({ store, payload }: { store: ReturnType<typeof memoryStore>['store']; payload: unknown }): Promise<unknown[]> {
    const pending = call({ fn: newRecording.run, ctx: context({ store, payload }) });
    pending.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(1000);
    return pending;
  }

  it('accepts a valid signature and returns the raw snake_case body', async () => {
    const { store } = await enabledStore();
    expect(await run({ store, payload: signedPayload({}) })).toEqual([meeting({})]);
  });

  it('drops a forged signature', async () => {
    const { store } = await enabledStore();
    const payload = signedPayload({ secret: `whsec_${Buffer.from('another-secret').toString('base64')}` });
    expect(await run({ store, payload })).toEqual([]);
  });

  it('drops a tampered body', async () => {
    const { store } = await enabledStore();
    const payload = { ...signedPayload({}), rawBody: JSON.stringify(meeting({ title: 'Injected' })) };
    expect(await run({ store, payload })).toEqual([]);
  });

  it('accepts a delivery 14 minutes old but drops one older than 15 minutes', async () => {
    const { store } = await enabledStore();
    const now = Math.floor(Date.now() / 1000);
    expect(await run({ store, payload: signedPayload({ id: 'msg_a', ts: now - 840 }) })).toHaveLength(1);
    expect(await run({ store, payload: signedPayload({ id: 'msg_b', ts: now - 901 }) })).toEqual([]);
  });

  it('drops a retried delivery with the same webhook-id', async () => {
    const { store } = await enabledStore();
    expect(await run({ store, payload: signedPayload({ id: 'msg_dup' }) })).toHaveLength(1);
    expect(await run({ store, payload: signedPayload({ id: 'msg_dup' }) })).toEqual([]);
  });

  it('emits once when two copies of the same delivery run at the same time', async () => {
    const { store } = await enabledStore();
    const payload = signedPayload({ id: 'msg_race' });
    const first = call({ fn: newRecording.run, ctx: context({ store, payload }) });
    const second = call({ fn: newRecording.run, ctx: context({ store, payload }) });
    await vi.advanceTimersByTimeAsync(1000);
    const results = await Promise.all([first, second]);
    expect(results.map((items) => items.length).sort()).toEqual([0, 1]);
  });

  it('keeps both recordings in the seen list when two different deliveries run at the same time', async () => {
    const { store, data } = await enabledStore();
    const first = call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({ id: 'msg_one' }) }) });
    const second = call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({ id: 'msg_two' }) }) });
    await vi.advanceTimersByTimeAsync(1000);
    expect((await Promise.all([first, second])).map((items) => items.length)).toEqual([1, 1]);
    const ids = fathomWebhook.seenDeliveryKeys({ seen: JSON.parse(data.get('_fathom_seen_ids') ?? '[]') });
    expect(ids.sort()).toEqual([fathomWebhook.deliveryKeyOf({ webhookId: 'msg_one' }), fathomWebhook.deliveryKeyOf({ webhookId: 'msg_two' })].sort());
  });

  it('re-adds its entry when another run overwrites the seen list right after its write', async () => {
    const holder = await enabledStore();
    let overwrites = 0;
    const racing = {
      ...holder.store,
      put: async <T>(key: string, value: T) => {
        await holder.store.put(key, value);
        if (key === '_fathom_seen_ids' && overwrites === 0) {
          overwrites++;
          await holder.store.put(key, [{ id: 'other', ts: Math.floor(Date.now() / 1000) }]);
        }
        return value;
      },
    };
    expect(await run({ store: racing, payload: signedPayload({ id: 'msg_mine' }) })).toHaveLength(1);
    const ids = fathomWebhook.seenDeliveryKeys({ seen: JSON.parse(holder.data.get('_fathom_seen_ids') ?? '[]') });
    expect(ids).toEqual(['other', fathomWebhook.deliveryKeyOf({ webhookId: 'msg_mine' })]);
  });

  it('drops a retry whose claim exists even if the seen list lost it to a concurrent write', async () => {
    const { store } = await enabledStore();
    expect(await run({ store, payload: signedPayload({ id: 'msg_lost' }) })).toHaveLength(1);
    await store.put('_fathom_seen_ids', []);
    expect(await run({ store, payload: signedPayload({ id: 'msg_lost' }) })).toEqual([]);
  });

  it('still drops a retry of the first event after 150 other events inside the window', async () => {
    const { store } = await enabledStore();
    const now = Math.floor(Date.now() / 1000);
    expect(await run({ store, payload: signedPayload({ id: 'msg_first', ts: now - 60 }) })).toHaveLength(1);
    for (let i = 0; i < 150; i++) {
      expect(await run({ store, payload: signedPayload({ id: `msg_${i}` }) })).toHaveLength(1);
    }
    expect(await run({ store, payload: signedPayload({ id: 'msg_first', ts: now - 60 }) })).toEqual([]);
  });

  it('throws a re-enable message for state saved by 0.2.x without a signing secret', async () => {
    const { store } = memoryStore();
    await store.put('_new_recording_webhook', { webhookId: 'wh_legacy' });
    await expect(run({ store, payload: signedPayload({}) })).rejects.toThrow('Turn the flow off and on again');
  });

  it('fails closed when the trigger is not enabled or headers are missing', async () => {
    const { store } = memoryStore();
    expect(await run({ store, payload: signedPayload({}) })).toEqual([]);
    const enabled = await enabledStore();
    expect(await run({ store: enabled.store, payload: { body: {}, rawBody: '{}', headers: {} } })).toEqual([]);
  });

  it('refuses rather than forgets when the window holds the maximum number of deliveries', async () => {
    const { store } = await enabledStore();
    const now = Math.floor(Date.now() / 1000);
    const full = Array.from({ length: fathomWebhook.MAX_SEEN_IDS }, (_, i) => ({ id: `k${i}`, ts: now }));
    await store.put('_fathom_seen_ids', full);
    await expect(run({ store, payload: signedPayload({ id: 'msg_over' }) })).rejects.toThrow('not processed');
  });

  it('refuses and releases its claim when the list fills up during the claim wait', async () => {
    const holder = await enabledStore();
    const now = Math.floor(Date.now() / 1000);
    const full = Array.from({ length: fathomWebhook.MAX_SEEN_IDS }, (_, i) => ({ id: `k${i}`, ts: now }));
    const filling = {
      ...holder.store,
      put: async <T>(key: string, value: T) => {
        await holder.store.put(key, value);
        if (key.startsWith('_fathom_delivery_')) {
          await holder.store.put('_fathom_seen_ids', full);
        }
        return value;
      },
    };
    await expect(run({ store: filling, payload: signedPayload({ id: 'msg_late' }) })).rejects.toThrow('not processed');
    expect(holder.data.has(`_fathom_delivery_${fathomWebhook.deliveryKeyOf({ webhookId: 'msg_late' })}`)).toBe(false);
    expect(JSON.parse(holder.data.get('_fathom_seen_ids') ?? '[]')).toHaveLength(fathomWebhook.MAX_SEEN_IDS);
  });

  it('deletes expired claims and onDisable deletes the rest', async () => {
    const { store, data } = await enabledStore();
    const now = Math.floor(Date.now() / 1000);
    await store.put('_fathom_seen_ids', [{ id: 'old', ts: now - 1000 }]);
    await store.put('_fathom_delivery_old', { token: 't', ts: now - 1000 });
    expect(await run({ store, payload: signedPayload({ id: 'msg_new' }) })).toHaveLength(1);
    expect(data.has('_fathom_delivery_old')).toBe(false);
    const newKey = `_fathom_delivery_${fathomWebhook.deliveryKeyOf({ webhookId: 'msg_new' })}`;
    expect(data.has(newKey)).toBe(true);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await call({ fn: newRecording.onDisable, ctx: context({ store }) });
    expect(data.size).toBe(0);
  });
});

describe('rememberDelivery', () => {
  const now = 1_800_000_000;

  it('keeps every ID inside the window past 100 events and flags a replay of the first', () => {
    let seen: unknown = [];
    for (let i = 0; i < 150; i++) {
      const next = fathomWebhook.rememberDelivery({ seen, deliveryKey: `k${i}`, timestamp: now - 600 + i, nowSeconds: now });
      expect(next.status).toBe('new');
      seen = next.seen;
    }
    expect(fathomWebhook.rememberDelivery({ seen, deliveryKey: 'k0', timestamp: now - 600, nowSeconds: now }).status).toBe('duplicate');
  });

  it('prunes by age, not by count', () => {
    const seen = [
      { id: 'stale', ts: now - fathomWebhook.TOLERANCE_SECONDS - 1 },
      { id: 'edge', ts: now - fathomWebhook.TOLERANCE_SECONDS },
    ];
    const next = fathomWebhook.rememberDelivery({ seen, deliveryKey: 'fresh', timestamp: now, nowSeconds: now });
    expect(next.status).toBe('new');
    expect(next.expired).toEqual(['stale']);
    expect(next.seen.map((entry) => entry.id)).toEqual(['edge', 'fresh']);
  });

  it('reports full instead of dropping a live ID at the cap', () => {
    const seen = Array.from({ length: fathomWebhook.MAX_SEEN_IDS }, (_, i) => ({ id: `k${i}`, ts: now }));
    const next = fathomWebhook.rememberDelivery({ seen, deliveryKey: 'extra', timestamp: now, nowSeconds: now });
    expect(next.status).toBe('full');
    expect(next.seen).toHaveLength(fathomWebhook.MAX_SEEN_IDS);
    expect(next.seen[0].id).toBe('k0');
  });

  it('ignores malformed stored entries', () => {
    const next = fathomWebhook.rememberDelivery({ seen: ['legacy', { id: 1 }, null], deliveryKey: 'a', timestamp: now, nowSeconds: now });
    expect(next.seen).toEqual([{ id: 'a', ts: now }]);
  });
});

describe('test()', () => {
  it('returns raw snake_case meetings and fetches the summary from /recordings under OAuth', async () => {
    const { store } = memoryStore();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: { items: [meeting({ recording_id: 42 })], next_cursor: null } }))
      .mockResolvedValueOnce(jsonResponse({ body: { summary: { template_name: 'general', markdown_formatted: '## S' } } }));
    const result = await call({ fn: newRecording.test, ctx: context({ store }) });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.fathom.ai/external/v1/meetings');
    expect(requestOf({ fetchMock, call: 1 }).url).toBe('https://api.fathom.ai/external/v1/recordings/42/summary');
    expect(result).toEqual([{ ...meeting({ recording_id: 42 }), default_summary: { template_name: 'general', markdown_formatted: '## S' } }]);
  });
});
