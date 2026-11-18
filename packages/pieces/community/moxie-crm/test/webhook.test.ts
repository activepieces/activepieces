import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { BASE, WEBHOOK_URL, fail, memoryStore, ok, request, runHook, sendRequest } from './helpers';
import { MOXIE_HOOK_STORE_KEY, MOXIE_STALE_HOOKS_STORE_KEY, moxieWebhook } from '../src/lib/common/webhook';
import { moxieCRMTriggers } from '../src/lib/triggers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

const CREDENTIALS = { baseUrl: BASE, apiKey: 'test-api-key' };
const BODY = { id: 'c1', name: 'Moxie, Inc.' };

function triggerNamed(name: string) {
  const trigger = moxieCRMTriggers.find((t) => t.name === `moxie_trigger_${name}`);
  if (trigger === undefined) {
    throw new Error(`missing trigger ${name}`);
  }
  return trigger;
}

beforeEach(() => {
  sendRequest.mockReset();
  sendRequest.mockResolvedValue({ status: 200, headers: {}, body: '' });
});

describe('delivery filter', () => {
  test('a delivery with the expected event type is emitted', () => {
    const payload = { body: BODY, headers: { 'x-event-type': 'ClientCreate', 'x-event-origin': 'withmoxie.com' } };
    expect(moxieWebhook.acceptDelivery({ eventType: 'ClientCreate', payload })).toEqual([BODY]);
  });

  test('a delivery for another event type is dropped', () => {
    const payload = { body: BODY, headers: { 'x-event-type': 'ClientDelete' } };
    expect(moxieWebhook.acceptDelivery({ eventType: 'ClientCreate', payload })).toEqual([]);
  });

  test('header names are matched case-insensitively', () => {
    const payload = { body: BODY, headers: { 'X-Event-Type': 'ClientDelete' } };
    expect(moxieWebhook.acceptDelivery({ eventType: 'ClientCreate', payload })).toEqual([]);
  });

  test('a delivery without the header still runs, for hooks added by hand', () => {
    expect(moxieWebhook.acceptDelivery({ eventType: 'ClientCreate', payload: { body: BODY, headers: {} } })).toEqual([BODY]);
  });

  test('a delivery from another origin is dropped', () => {
    const payload = { body: BODY, headers: { 'x-event-origin': 'evil.io' } };
    expect(moxieWebhook.acceptDelivery({ eventType: 'ClientCreate', payload })).toEqual([]);
  });

  test('two identical deliveries both run, since Moxie sends no event id to tell a retry from a repeat', () => {
    const payload = { body: BODY, headers: { 'x-event-type': 'AgreementViewed' } };
    expect(moxieWebhook.acceptDelivery({ eventType: 'AgreementViewed', payload })).toEqual([BODY]);
    expect(moxieWebhook.acceptDelivery({ eventType: 'AgreementViewed', payload })).toEqual([BODY]);
  });
});

describe('subscribe and unsubscribe', () => {
  test('enable posts the event type and flow URL, then stores the hook', async () => {
    ok({ body: 'hook-1' });
    const { store, data } = memoryStore();
    await moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL });
    expect(request(0)).toMatchObject({
      method: HttpMethod.POST,
      url: `${BASE}/api/subscribe`,
      body: { type: 'TicketCreate', hookUrl: WEBHOOK_URL },
    });
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toEqual({ id: 'hook-1', type: 'TicketCreate', hookUrl: WEBHOOK_URL });
  });

  test('a failed store write unsubscribes the new hook and rethrows', async () => {
    ok({ body: 'hook-1' });
    ok({ body: '' });
    const { store } = memoryStore({ failPut: true });
    await expect(
      moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL }),
    ).rejects.toThrow('store unavailable');
    expect(request(1)).toMatchObject({
      url: `${BASE}/api/unsubscribe`,
      body: { id: 'hook-1', type: 'TicketCreate', hookUrl: WEBHOOK_URL },
    });
  });

  test('a hook left from an earlier enable is removed only after the new one is stored', async () => {
    const previous = { id: 'old', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: previous } });
    ok({ body: 'new' });
    ok({ body: '' });
    await moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL });
    expect(request(0)).toMatchObject({ url: `${BASE}/api/subscribe` });
    expect(request(1)).toMatchObject({ url: `${BASE}/api/unsubscribe`, body: previous });
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toMatchObject({ id: 'new' });
  });

  test('a failed subscribe keeps the earlier hook registered and tracked', async () => {
    const previous = { id: 'old', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: previous } });
    fail({ status: 500, body: { message: 'boom' } });
    await expect(
      moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL }),
    ).rejects.toThrow('HTTP 500');
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toEqual(previous);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  test('a failed removal of the earlier hook keeps it tracked, and disable removes it later', async () => {
    const previous = { id: 'old', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: previous } });
    ok({ body: 'new' });
    fail({ status: 500, body: { message: 'boom' } });
    await moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL });
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toMatchObject({ id: 'new' });
    expect(data.get(MOXIE_STALE_HOOKS_STORE_KEY)).toEqual([previous]);
    ok({ body: '' });
    ok({ body: '' });
    await moxieWebhook.disable({ credentials: CREDENTIALS, store });
    expect(request(2)).toMatchObject({ url: `${BASE}/api/unsubscribe`, body: previous });
    expect(request(3)).toMatchObject({ url: `${BASE}/api/unsubscribe`, body: { id: 'new' } });
    expect(data.has(MOXIE_STALE_HOOKS_STORE_KEY)).toBe(false);
    expect(data.has(MOXIE_HOOK_STORE_KEY)).toBe(false);
  });

  test('the earlier hook is recorded for removal before the new one replaces it, so no single failure loses it', async () => {
    const previous = { id: 'old', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data, spies } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: previous } });
    spies.put.mockImplementation(async (key, value) => {
      if (key === MOXIE_HOOK_STORE_KEY) {
        throw new Error('store unavailable');
      }
      data.set(key, value);
      return value;
    });
    ok({ body: 'new' });
    ok({ body: '' });
    await expect(
      moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL }),
    ).rejects.toThrow('store unavailable');
    expect(request(1)).toMatchObject({ url: `${BASE}/api/unsubscribe`, body: { id: 'new' } });
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toEqual(previous);
    expect(data.get(MOXIE_STALE_HOOKS_STORE_KEY)).toEqual([previous]);
  });

  test('a failed store read stops enable before anything is subscribed', async () => {
    const { store, spies } = memoryStore();
    spies.get.mockRejectedValue(new Error('store unavailable'));
    await expect(
      moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL }),
    ).rejects.toThrow('store unavailable');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('a successful removal clears the earlier hook from the removal list', async () => {
    const previous = { id: 'old', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: previous } });
    ok({ body: 'new' });
    ok({ body: '' });
    await moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL });
    expect(data.has(MOXIE_STALE_HOOKS_STORE_KEY)).toBe(false);
  });

  test('disable keeps a stale hook tracked when its removal fails again', async () => {
    const stale = { id: 'old', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_STALE_HOOKS_STORE_KEY]: [stale] } });
    fail({ status: 500, body: { message: 'boom' } });
    await moxieWebhook.disable({ credentials: CREDENTIALS, store });
    expect(data.get(MOXIE_STALE_HOOKS_STORE_KEY)).toEqual([stale]);
  });

  test('an earlier hook with an id is removed even when the new subscription returns no id', async () => {
    const previous = { id: 'old', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: previous } });
    ok({ body: { unexpected: true } });
    ok({ body: '' });
    await moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL });
    expect(request(1)).toMatchObject({ url: `${BASE}/api/unsubscribe`, body: previous });
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toEqual({ id: null, type: 'TicketCreate', hookUrl: WEBHOOK_URL });
  });

  test('an earlier hook without an id on the same URL is not removed, since that would remove the new one too', async () => {
    const previous = { id: null, type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: previous } });
    ok({ body: '' });
    await moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketCreate', hookUrl: WEBHOOK_URL });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  test('a subscribe response without an id still allows unsubscribing by type and URL', async () => {
    ok({ body: { unexpected: true } });
    const { store, data } = memoryStore();
    await moxieWebhook.enable({ credentials: CREDENTIALS, store, type: 'TicketClose', hookUrl: WEBHOOK_URL });
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toEqual({ id: null, type: 'TicketClose', hookUrl: WEBHOOK_URL });
    ok({ body: '' });
    await moxieWebhook.disable({ credentials: CREDENTIALS, store });
    expect(request(1)).toMatchObject({ body: { type: 'TicketClose', hookUrl: WEBHOOK_URL } });
  });

  test('disable forgets the hook after a 200', async () => {
    const hook = { id: 'hook-1', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: hook } });
    ok({ body: '' });
    await moxieWebhook.disable({ credentials: CREDENTIALS, store });
    expect(request(0)).toMatchObject({ url: `${BASE}/api/unsubscribe`, body: hook });
    expect(data.has(MOXIE_HOOK_STORE_KEY)).toBe(false);
  });

  test('disable forgets the hook after a 404', async () => {
    const hook = { id: 'hook-1', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: hook } });
    fail({ status: 404 });
    await moxieWebhook.disable({ credentials: CREDENTIALS, store });
    expect(data.has(MOXIE_HOOK_STORE_KEY)).toBe(false);
  });

  test('disable keeps the hook id when Moxie fails with a 500', async () => {
    const hook = { id: 'hook-1', type: 'TicketCreate', hookUrl: WEBHOOK_URL };
    const { store, data } = memoryStore({ initial: { [MOXIE_HOOK_STORE_KEY]: hook } });
    fail({ status: 500, body: { message: 'boom' } });
    await expect(moxieWebhook.disable({ credentials: CREDENTIALS, store })).rejects.toThrow('HTTP 500');
    expect(data.get(MOXIE_HOOK_STORE_KEY)).toEqual(hook);
  });

  test('disable with nothing stored sends no request', async () => {
    const { store } = memoryStore();
    await moxieWebhook.disable({ credentials: CREDENTIALS, store });
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('trigger wiring', () => {
  test('32 triggers ship: the 22 existing names plus 10 new ones, no Proposal triggers', () => {
    const names = moxieCRMTriggers.map((t) => t.name.replace('moxie_trigger_', ''));
    expect(names).toHaveLength(32);
    expect(names).toEqual(
      expect.arrayContaining([
        'client_created',
        'payment_received',
        'invoice_voided',
        'invoice_write_off',
        'agreement_sent',
        'agreement_viewed',
        'agreement_signed',
        'ticket_created',
        'ticket_updated',
        'ticket_closed',
        'ticket_comment_added',
        'ticket_deleted',
      ]),
    );
    expect(names.some((n) => n.startsWith('proposal'))).toBe(false);
    for (const trigger of moxieCRMTriggers) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description).toBeTruthy();
    }
  });

  test('a new trigger subscribes its own event type on enable and unsubscribes on disable', async () => {
    const { store } = memoryStore();
    ok({ body: 'hook-9' });
    await runHook({ trigger: triggerNamed('ticket_created'), hook: 'onEnable', context: { store } });
    expect(request(0)).toMatchObject({ url: `${BASE}/api/subscribe`, body: { type: 'TicketCreate', hookUrl: WEBHOOK_URL } });
    ok({ body: '' });
    await runHook({ trigger: triggerNamed('ticket_created'), hook: 'onDisable', context: { store } });
    expect(request(1)).toMatchObject({ url: `${BASE}/api/unsubscribe`, body: { id: 'hook-9', type: 'TicketCreate' } });
  });

  test('an existing trigger keeps manual setup: enable sends nothing', async () => {
    const { store } = memoryStore();
    await runHook({ trigger: triggerNamed('client_created'), hook: 'onEnable', context: { store } });
    await runHook({ trigger: triggerNamed('client_created'), hook: 'onDisable', context: { store } });
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('an existing trigger drops deliveries of another event and runs every matching one', async () => {
    const { store } = memoryStore();
    const trigger = triggerNamed('client_created');
    const wrong = { body: BODY, headers: { 'x-event-type': 'ClientUpdate' }, queryParams: {} };
    const right = { body: BODY, headers: { 'x-event-type': 'ClientCreate' }, queryParams: {} };
    await expect(runHook({ trigger, hook: 'run', context: { store, payload: wrong } })).resolves.toEqual([]);
    await expect(runHook({ trigger, hook: 'run', context: { store, payload: right } })).resolves.toEqual([BODY]);
    await expect(runHook({ trigger, hook: 'run', context: { store, payload: right } })).resolves.toEqual([BODY]);
  });

  test('invoice triggers carry the InvoiceMini output schema and every ticket trigger the ticket schema', () => {
    expect(triggerNamed('invoice_voided').outputSchema?.fields.map((f) => f.key)).toContain('invoiceNumberFormatted');
    expect(triggerNamed('payment_received').outputSchema).toBeDefined();
    for (const name of ['ticket_created', 'ticket_updated', 'ticket_comment_added', 'ticket_closed', 'ticket_deleted']) {
      expect(triggerNamed(name).outputSchema?.fields.map((f) => f.key)).toEqual(['ticket', 'comments']);
    }
    expect(triggerNamed('agreement_signed').outputSchema).toBeUndefined();
  });
});
