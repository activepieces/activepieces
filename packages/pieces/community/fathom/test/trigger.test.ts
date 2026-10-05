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
  async function enabledStore() {
    const holder = memoryStore();
    await holder.store.put('_new_recording_webhook', { webhookId: 'wh_1', secret: SECRET });
    return holder;
  }

  it('accepts a valid signature and returns the raw snake_case body', async () => {
    const { store } = await enabledStore();
    const result = await call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({}) }) });
    expect(result).toEqual([meeting({})]);
  });

  it('drops a forged signature', async () => {
    const { store } = await enabledStore();
    const payload = signedPayload({ secret: `whsec_${Buffer.from('another-secret').toString('base64')}` });
    expect(await call({ fn: newRecording.run, ctx: context({ store, payload }) })).toEqual([]);
  });

  it('drops a tampered body', async () => {
    const { store } = await enabledStore();
    const payload = { ...signedPayload({}), rawBody: JSON.stringify(meeting({ title: 'Injected' })) };
    expect(await call({ fn: newRecording.run, ctx: context({ store, payload }) })).toEqual([]);
  });

  it('accepts a delivery 14 minutes old but drops one older than 15 minutes', async () => {
    const { store } = await enabledStore();
    const now = Math.floor(Date.now() / 1000);
    expect(await call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({ id: 'msg_a', ts: now - 840 }) }) })).toHaveLength(1);
    expect(await call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({ id: 'msg_b', ts: now - 901 }) }) })).toEqual([]);
  });

  it('drops a retried delivery with the same webhook-id', async () => {
    const { store } = await enabledStore();
    expect(await call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({ id: 'msg_dup' }) }) })).toHaveLength(1);
    expect(await call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({ id: 'msg_dup' }) }) })).toEqual([]);
  });

  it('fails closed when no secret is stored or headers are missing', async () => {
    const { store } = memoryStore();
    expect(await call({ fn: newRecording.run, ctx: context({ store, payload: signedPayload({}) }) })).toEqual([]);
    const enabled = await enabledStore();
    expect(await call({ fn: newRecording.run, ctx: context({ store: enabled.store, payload: { body: {}, rawBody: '{}', headers: {} } }) })).toEqual([]);
  });

  it('keeps the dedupe list bounded', () => {
    const seen = Array.from({ length: 100 }, (_, i) => `m${i}`);
    const next = fathomWebhook.rememberDelivery({ seen, webhookId: 'new' });
    expect(next.seen).toHaveLength(100);
    expect(next.seen[99]).toBe('new');
    expect(next.seen[0]).toBe('m1');
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
