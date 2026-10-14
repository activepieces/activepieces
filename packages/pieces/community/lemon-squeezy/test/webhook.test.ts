import { createHmac } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createWebhookTriggerKey,
  disableWebhook,
  enableWebhook,
  generateWebhookSecret,
  handleWebhook,
  verifyLemonSqueezySignature,
} from '../src/lib/common/webhook';
import { readPath } from '../src/lib/common/client';
import { orderCreatedTrigger } from '../src/lib/triggers/order-created';
import { AUTH, installFetch, jsonResponse, memoryStore } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const SECRET = 'a'.repeat(40);
const EVENT = 'order_created';

describe('signature verification', () => {
  it('accepts a valid HMAC-SHA256 of the raw body (string or Buffer)', () => {
    const raw = delivery({});
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: sign({ raw }), rawBody: raw })).toBe(true);
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: sign({ raw }), rawBody: Buffer.from(raw) })).toBe(true);
  });

  it('rejects forged, missing, malformed or wrong-length signatures', () => {
    const raw = delivery({});
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: sign({ raw, secret: 'other' }), rawBody: raw })).toBe(false);
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: undefined, rawBody: raw })).toBe(false);
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: 'zz', rawBody: raw })).toBe(false);
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: sign({ raw }).slice(0, 10), rawBody: raw })).toBe(false);
    expect(verifyLemonSqueezySignature({ secret: undefined, signature: sign({ raw }), rawBody: raw })).toBe(false);
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: sign({ raw }), rawBody: undefined })).toBe(false);
    expect(verifyLemonSqueezySignature({ secret: SECRET, signature: sign({ raw }), rawBody: raw + ' ' })).toBe(false);
  });
});

describe('handleWebhook', () => {
  it('emits a signed delivery once and drops the replay', async () => {
    const store = storeWithSecret();
    const raw = delivery({});
    expect(await handleWebhook({ ...signed({ raw }), store, eventName: EVENT })).toEqual([JSON.parse(raw)]);
    expect(await handleWebhook({ ...signed({ raw }), store, eventName: EVENT })).toEqual([]);
    const later = delivery({ updatedAt: '2026-10-12T11:00:00.000000Z' });
    expect(await handleWebhook({ ...signed({ raw: later }), store, eventName: EVENT })).toHaveLength(1);
  });

  it('drops forged and unsigned deliveries', async () => {
    const raw = delivery({});
    expect(await handleWebhook({ ...signed({ raw, secret: 'attacker' }), store: storeWithSecret(), eventName: EVENT })).toEqual([]);
    expect(await handleWebhook({ payload: { body: JSON.parse(raw), rawBody: raw, headers: {} }, store: storeWithSecret(), eventName: EVENT })).toEqual([]);
  });

  it('drops a signed delivery for another event', async () => {
    const raw = delivery({ event: 'order_refunded' });
    expect(await handleWebhook({ ...signed({ raw }), store: storeWithSecret(), eventName: EVENT })).toEqual([]);
  });

  it('bounds the dedupe list', async () => {
    const store = storeWithSecret();
    for (let i = 1; i <= 205; i++) {
      await handleWebhook({ ...signed({ raw: delivery({ id: String(i) }) }), store, eventName: EVENT });
    }
    const seen = store.data.get('_order_created_seen');
    expect(Array.isArray(seen) ? seen.length : 0).toBe(200);
  });

  it('is wired into the triggers', async () => {
    const raw = delivery({});
    const context = { ...signed({ raw, secret: 'attacker' }), store: storeWithSecret() };
    expect(await Reflect.apply(orderCreatedTrigger.run, orderCreatedTrigger, [context])).toEqual([]);
  });
});

describe('enable / disable', () => {
  it('creates the webhook in the key mode with a 40-character random secret', async () => {
    const { calls } = installFetch({
      'GET /users/me': () => jsonResponse({ value: { meta: { test_mode: true }, data: { id: '1', type: 'users' } } }),
      'POST /webhooks': () => jsonResponse({ value: { data: { id: '77', type: 'webhooks' } }, status: 201 }),
    });
    const store = memoryStore();
    await enableWebhook({ auth: AUTH, store, storeId: '5', webhookUrl: 'https://ap.test/hook', eventName: EVENT });
    const attributes = readPath({ value: calls[1].body, path: ['data', 'attributes'] });
    expect(readPath({ value: attributes, path: ['test_mode'] })).toBe(true);
    expect(readPath({ value: attributes, path: ['events'] })).toEqual([EVENT]);
    const secret = readPath({ value: attributes, path: ['secret'] });
    expect(secret).toMatch(/^[0-9a-f]{40}$/);
    expect(readPath({ value: calls[1].body, path: ['data', 'relationships', 'store', 'data', 'id'] })).toBe('5');
    expect(store.data.get('_order_created_trigger')).toMatchObject({ webhookId: '77', secret, testMode: true });
  });

  it('keeps the signing secret out of error logs when creating the webhook fails', async () => {
    installFetch({
      'GET /users/me': () => jsonResponse({ value: { meta: { test_mode: true } } }),
      'POST /webhooks': () => jsonResponse({ value: { errors: [{ detail: 'The url field is invalid.' }] }, status: 422 }),
    });
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = await enableWebhook({ auth: AUTH, store: memoryStore(), storeId: '5', webhookUrl: 'u', eventName: EVENT }).catch((e) => e);
    const logged = JSON.stringify(logSpy.mock.calls.map((call) => call.map((arg) => (arg instanceof Error ? arg.message : arg))));
    logSpy.mockRestore();
    expect(error.message).toContain('The url field is invalid.');
    expect(logged).not.toMatch(/[0-9a-f]{40}/);
    expect(logged).not.toContain('"secret"');
  });

  it('uses live mode for a live key', async () => {
    const { calls } = installFetch({
      'GET /users/me': () => jsonResponse({ value: { meta: { test_mode: false }, data: { id: '1', type: 'users' } } }),
      'POST /webhooks': () => jsonResponse({ value: { data: { id: '77', type: 'webhooks' } }, status: 201 }),
    });
    await enableWebhook({ auth: AUTH, store: memoryStore(), storeId: '5', webhookUrl: 'https://ap.test/hook', eventName: EVENT });
    expect(readPath({ value: calls[1].body, path: ['data', 'attributes', 'test_mode'] })).toBe(false);
  });

  it('deletes the new webhook when saving it fails', async () => {
    const { calls } = installFetch({
      'GET /users/me': () => jsonResponse({ value: { meta: { test_mode: true } } }),
      'POST /webhooks': () => jsonResponse({ value: { data: { id: '77', type: 'webhooks' } }, status: 201 }),
      'DELETE /webhooks/77': () => jsonResponse({ value: null, status: 204 }),
    });
    const store = {
      ...memoryStore(),
      put: async () => {
        throw new Error('store down');
      },
    };
    await expect(enableWebhook({ auth: AUTH, store, storeId: '5', webhookUrl: 'u', eventName: EVENT })).rejects.toThrow('store down');
    expect(calls.map((c) => `${c.method} ${c.url.pathname}`)).toContain('DELETE /v1/webhooks/77');
  });

  it('generates different 40-character secrets (Lemon Squeezy max)', () => {
    expect(generateWebhookSecret()).toHaveLength(40);
    expect(generateWebhookSecret()).not.toBe(generateWebhookSecret());
  });

  it('treats a 404 on delete as already removed and clears state', async () => {
    installFetch({ 'DELETE /webhooks/77': () => jsonResponse({ value: { errors: [{ detail: 'Not found' }] }, status: 404 }) });
    const store = memoryStore({ _order_created_trigger: { webhookId: '77', secret: SECRET, storeId: '5' }, _order_created_seen: ['x'] });
    await disableWebhook({ auth: AUTH, store, eventName: EVENT });
    expect(store.data.size).toBe(0);
  });

  it('keeps state when delete fails for another reason', async () => {
    installFetch({ 'DELETE /webhooks/77': () => jsonResponse({ value: {}, status: 500 }) });
    const store = memoryStore({ _order_created_trigger: { webhookId: '77', secret: SECRET, storeId: '5' } });
    await expect(disableWebhook({ auth: AUTH, store, eventName: EVENT })).rejects.toThrow(/500/);
    expect(store.data.has('_order_created_trigger')).toBe(true);
  });
});

function sign({ raw, secret = SECRET }: { raw: string; secret?: string }): string {
  return createHmac('sha256', secret).update(raw).digest('hex');
}

function delivery({ event = EVENT, id = '42', updatedAt = '2026-10-12T10:00:00.000000Z' }: { event?: string; id?: string; updatedAt?: string }): string {
  return JSON.stringify({ meta: { event_name: event, test_mode: true }, data: { type: 'orders', id, attributes: { updated_at: updatedAt } } });
}

function signed({ raw, secret }: { raw: string; secret?: string }) {
  return { payload: { body: JSON.parse(raw), rawBody: raw, headers: { 'X-Signature': sign({ raw, secret }) } } };
}

function storeWithSecret() {
  return memoryStore({ [createWebhookTriggerKey(EVENT)]: { webhookId: '1', secret: SECRET, storeId: '5' } });
}
