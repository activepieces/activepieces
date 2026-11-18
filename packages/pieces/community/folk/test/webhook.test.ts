import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpError, memoryStore, TEST_AUTH } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

import { folkWebhook } from '../src/lib/common/webhook';

const SECRET = `whsec_${Buffer.from('super-secret-key').toString('base64')}`;
const handlers = folkWebhook.handlers({ eventType: 'person.created', label: 'Person Added' });

function delivery({ id = 'msg_1', body = { id: 'evt_1', type: 'person.created', data: { id: 'per_1' } }, ts = Math.floor(Date.now() / 1000), secret = SECRET } = {}) {
  const raw = JSON.stringify(body);
  return {
    body,
    rawBody: raw,
    headers: { 'Webhook-Id': id, 'webhook-timestamp': String(ts), 'webhook-signature': folkWebhook.sign({ secret, webhookId: id, timestamp: ts, body: raw }) },
  };
}

beforeEach(() => sendRequest.mockReset());

describe('signature + dedupe', () => {
  it('accepts a valid delivery once and drops the retry', async () => {
    const store = memoryStore();
    store.data.set('_signingSecret', SECRET);
    const payload = delivery();
    expect(await handlers.run({ store, payload })).toEqual([payload.body]);
    expect(await handlers.run({ store, payload })).toEqual([]);
  });

  it('drops a bad signature, a stale timestamp and other event types', async () => {
    const store = memoryStore();
    store.data.set('_signingSecret', SECRET);
    const forged = delivery({ secret: `whsec_${Buffer.from('other').toString('base64')}` });
    expect(await handlers.run({ store, payload: forged })).toEqual([]);
    const stale = delivery({ ts: Math.floor(Date.now() / 1000) - folkWebhook.TOLERANCE_SECONDS - 60 });
    expect(await handlers.run({ store, payload: stale })).toEqual([]);
    const other = delivery({ body: { id: 'evt_2', type: 'person.deleted', data: { id: 'per_1' } } });
    expect(await handlers.run({ store, payload: other })).toEqual([]);
  });

  it('keeps the seen list bounded', () => {
    const seen = Array.from({ length: folkWebhook.MAX_SEEN_IDS }, (_, i) => `e${i}`);
    const result = folkWebhook.rememberDelivery({ seen, deliveryId: 'new' });
    expect(result.seen).toHaveLength(folkWebhook.MAX_SEEN_IDS);
    expect(result.seen.at(-1)).toBe('new');
    expect(result.seen).not.toContain('e0');
    expect(result.evicted).toEqual(['e0']);
  });

  it('lets only one of two parallel deliveries of the same event through', async () => {
    const store = memoryStore();
    store.data.set('_signingSecret', SECRET);
    const first = delivery({ id: 'msg_a' });
    const second = delivery({ id: 'msg_b' });
    const results = await Promise.all([
      handlers.run({ store, payload: first }),
      handlers.run({ store, payload: second }),
    ]);
    expect(results.flat()).toHaveLength(1);
  });

  it('clears claim keys on disable', async () => {
    const store = memoryStore();
    store.data.set('_signingSecret', SECRET);
    await handlers.run({ store, payload: delivery() });
    const claimKeys = [...store.data.keys()].filter((key) => key.startsWith('_evt_'));
    expect(claimKeys).toHaveLength(1);
    await handlers.onDisable({ auth: TEST_AUTH, store });
    expect([...store.data.keys()]).toEqual([]);
  });
});

describe('lifecycle', () => {
  it('stores ID and secret, with a group filter', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 'wbk_1', signingSecret: SECRET } } });
    const store = memoryStore();
    await handlers.onEnable({ auth: TEST_AUTH, webhookUrl: 'https://hook', store, propsValue: { groupId: 'grp_1' } });
    expect(sendRequest.mock.calls[0][0].body).toEqual({
      name: 'Activepieces Person Added',
      targetUrl: 'https://hook',
      subscribedEvents: [{ eventType: 'person.created', filter: { groupId: 'grp_1' } }],
    });
    expect(store.data.get('_webhookId')).toBe('wbk_1');
    expect(store.data.get('_signingSecret')).toBe(SECRET);
  });

  it('deletes the new webhook when the store write fails', async () => {
    sendRequest
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 'wbk_1', signingSecret: SECRET } } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: {} });
    const store = memoryStore({ failPut: true });
    await expect(handlers.onEnable({ auth: TEST_AUTH, webhookUrl: 'https://hook', store, propsValue: {} })).rejects.toThrow('store down');
    expect(sendRequest.mock.calls[1][0].method).toBe('DELETE');
    expect(sendRequest.mock.calls[1][0].url).toBe('https://api.folk.app/v1/webhooks/wbk_1');
    expect(sendRequest.mock.calls[1][0].body).toBeUndefined();
  });

  it('treats 404 on disable as deleted, rethrows other errors and keeps state', async () => {
    const store = memoryStore();
    store.data.set('_webhookId', 'wbk_1');
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: {} }));
    await handlers.onDisable({ auth: TEST_AUTH, store });
    expect(store.data.has('_webhookId')).toBe(false);
    store.data.set('_webhookId', 'wbk_2');
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: {} }));
    await expect(handlers.onDisable({ auth: TEST_AUTH, store })).rejects.toThrow(/HTTP 500/);
    expect(store.data.get('_webhookId')).toBe('wbk_2');
  });
});
