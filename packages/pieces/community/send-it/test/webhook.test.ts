import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { sendItWebhook } from '../src/lib/common/webhook-trigger';
import { triggerMappers } from '../src/lib/common/trigger-mappers';
import { API_KEY, memoryStore, replies, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const SECRET = 'whsec_test';
const NOW = 1_800_000_000_000;
const body = { deliveryId: 'dlv_1', event: 'post.published', timestamp: '2026-01-01T00:00:00Z', data: { platform: 'x', postId: '1', postUrl: 'https://x.com/1', content: { text: 'hi' }, publishedAt: '2026-01-01T00:00:00Z' } };
const raw = JSON.stringify(body);

function sign({ t = Math.floor(NOW / 1000), payload = raw, secret = SECRET } = {}): string {
  return `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;
}

function handle({ store, signature, rawBody = raw, parsed = body }: { store: ReturnType<typeof memoryStore>; signature?: string; rawBody?: unknown; parsed?: unknown }) {
  return sendItWebhook.handle({ store, event: 'post.published', payload: { body: parsed, rawBody, headers: signature === undefined ? {} : { 'X-SendIt-Signature': signature } }, mapEvent: triggerMappers.published, now: NOW });
}

describe('webhook signature', () => {
  test('accepts a valid signature and maps the event', async () => {
    const out = await handle({ store: memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET }), signature: sign() });
    expect(out).toEqual([expect.objectContaining({ delivery_id: 'dlv_1', platform: 'x', post_id: '1', [DEDUPE_KEY_PROPERTY]: 'sendit:dlv_1' })]);
  });

  test('accepts a Buffer raw body', async () => {
    expect(await handle({ store: memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET }), signature: sign(), rawBody: Buffer.from(raw) })).toHaveLength(1);
  });

  test('drops unsigned, forged, wrong-secret, tampered and stale deliveries', async () => {
    const stored = () => memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET });
    expect(await handle({ store: stored() })).toEqual([]);
    expect(await handle({ store: stored(), signature: 't=1800000000,v1=deadbeef' })).toEqual([]);
    expect(await handle({ store: stored(), signature: sign({ secret: 'other' }) })).toEqual([]);
    expect(await handle({ store: stored(), signature: sign(), rawBody: raw.replace('hi', 'ho') })).toEqual([]);
    expect(await handle({ store: stored(), signature: sign({ t: Math.floor(NOW / 1000) - 901 }) })).toEqual([]);
    expect(await handle({ store: stored(), signature: 'v1=abc' })).toEqual([]);
  });

  test('allows queue lag inside the 15 minute window', async () => {
    expect(await handle({ store: memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET }), signature: sign({ t: Math.floor(NOW / 1000) - 600 }) })).toHaveLength(1);
  });

  test('ignores other events and dedupes replays by deliveryId', async () => {
    const store = memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET });
    expect(await handle({ store, signature: sign(), parsed: { ...body, event: 'post.failed' } })).toEqual([]);
    expect(await handle({ store, signature: sign() })).toHaveLength(1);
    expect(await handle({ store, signature: sign() })).toEqual([]);
  });

  test('concurrent deliveries keep each other deduplicated', async () => {
    const store = memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET });
    const second = { ...body, deliveryId: 'dlv_2' };
    const rawSecond = JSON.stringify(second);
    const [a, b] = await Promise.all([
      handle({ store, signature: sign() }),
      handle({ store, signature: sign({ payload: rawSecond }), rawBody: rawSecond, parsed: second }),
    ]);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(await handle({ store, signature: sign() })).toEqual([]);
    expect(await handle({ store, signature: sign({ payload: rawSecond }), rawBody: rawSecond, parsed: second })).toEqual([]);
  });

  test('deliveries recorded in the old shared list stay deduplicated', async () => {
    const store = memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET, seenDeliveryIds: ['dlv_1'] });
    expect(await handle({ store, signature: sign() })).toEqual([]);
  });

  test('old delivery markers are cleaned up after the replay window', async () => {
    const store = memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET });
    await handle({ store, signature: sign() });
    expect(store.data.has('seenDelivery:dlv_1')).toBe(true);
    const later = { ...body, deliveryId: 'dlv_9' };
    const rawLater = JSON.stringify(later);
    const laterNow = NOW + 31 * 60 * 1000;
    const out = await sendItWebhook.handle({ store, event: 'post.published', payload: { body: later, rawBody: rawLater, headers: { 'X-SendIt-Signature': sign({ t: Math.floor(laterNow / 1000), payload: rawLater }) } }, mapEvent: triggerMappers.published, now: laterNow });
    expect(out).toHaveLength(1);
    expect(store.data.has('seenDelivery:dlv_1')).toBe(false);
    expect(store.data.has('seenDelivery:dlv_9')).toBe(true);
  });

  test('markers inside the replay window are never deleted, and cleanup is bounded per event', async () => {
    const recent = Array.from({ length: 1500 }, (_, i) => ({ id: `r${i}`, at: NOW - 60 * 1000 }));
    const old = Array.from({ length: 100 }, (_, i) => ({ id: `o${i}`, at: NOW - 60 * 60 * 1000 }));
    const initial: Record<string, unknown> = { webhookId: 'wh_1', webhookSecret: SECRET, seenDeliveryIndex: [...old, ...recent] };
    for (const entry of [...old, ...recent]) initial[`seenDelivery:${entry.id}`] = entry.at;
    const store = memoryStore(initial);
    expect(await handle({ store, signature: sign() })).toHaveLength(1);
    expect(recent.every((entry) => store.data.has(`seenDelivery:${entry.id}`))).toBe(true);
    expect(old.filter((entry) => !store.data.has(`seenDelivery:${entry.id}`))).toHaveLength(25);
  });

  test('legacy store without a secret still fires; no webhook at all drops', async () => {
    expect(await handle({ store: memoryStore({ webhookId: 'wh_old' }) })).toHaveLength(1);
    expect(await handle({ store: memoryStore() })).toEqual([]);
  });
});

describe('webhook lifecycle', () => {
  test('enable stores id + secret', async () => {
    const seen = stubFetch(replies([{ body: { success: true, webhook: { id: 'wh_1', secret: SECRET } } }]));
    const store = memoryStore();
    await sendItWebhook.enable({ apiKey: API_KEY, store, event: 'post.published', webhookUrl: 'https://hook' });
    expect(seen[0].body).toEqual({ url: 'https://hook', events: ['post.published'] });
    expect(store.data.get('webhookId')).toBe('wh_1');
    expect(store.data.get('webhookSecret')).toBe(SECRET);
  });

  test('enable deletes the webhook when the store write fails', async () => {
    const seen = stubFetch(replies([{ body: { success: true, webhook: { id: 'wh_1', secret: SECRET } } }, { body: { success: true } }]));
    const store = memoryStore();
    store.put = async () => { throw new Error('store down'); };
    await expect(sendItWebhook.enable({ apiKey: API_KEY, store, event: 'post.published', webhookUrl: 'https://hook' })).rejects.toThrow('store down');
    expect(seen[1].method).toBe('DELETE');
    expect(seen[1].path).toBe('/api/v1/webhooks/wh_1');
  });

  test('enable fails and cleans up when no secret is returned', async () => {
    const seen = stubFetch(replies([{ body: { success: true, webhook: { id: 'wh_1' } } }, { body: {} }]));
    await expect(sendItWebhook.enable({ apiKey: API_KEY, store: memoryStore(), event: 'post.published', webhookUrl: 'https://hook' })).rejects.toThrow('signing secret');
    expect(seen[1].method).toBe('DELETE');
  });

  test('disable treats 404 as done and clears the store', async () => {
    stubFetch(replies([{ status: 404, body: { success: false, error: 'not found' } }]));
    const store = memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET, seenDeliveryIds: ['a'] });
    await handle({ store, signature: sign() });
    await sendItWebhook.disable({ apiKey: API_KEY, store });
    expect(store.data.size).toBe(0);
  });

  test('disable keeps the store when delete fails for another reason', async () => {
    stubFetch(replies([{ status: 500, body: { error: 'boom' } }]));
    const store = memoryStore({ webhookId: 'wh_1', webhookSecret: SECRET });
    await expect(sendItWebhook.disable({ apiKey: API_KEY, store })).rejects.toThrow('boom');
    expect(store.data.get('webhookId')).toBe('wh_1');
  });
});
