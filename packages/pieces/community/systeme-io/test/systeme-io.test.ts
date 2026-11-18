import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { API_KEY, BASE, fail, memoryStore, ok, request, runAction, runHook, sendRequest, sign } from './helpers';
import { systemeIoCommon, systemeIoInput } from '../src/lib/common/client';
import { contactDropdownOptions } from '../src/lib/common/dropdowns';
import { findContactByEmail } from '../src/lib/actions/find-contact-by-email';
import { updateContact } from '../src/lib/actions/update-contact';
import { findContacts } from '../src/lib/actions/find-contacts';
import { deleteContact } from '../src/lib/actions/delete-contact';
import { createTag } from '../src/lib/actions/create-tag';
import { enrollContactInCourse } from '../src/lib/actions/enroll-contact-in-course';
import { removeCourseEnrollment } from '../src/lib/actions/remove-course-enrollment';
import { addContactToCommunity } from '../src/lib/actions/add-contact-to-community';
import { cancelSubscription } from '../src/lib/actions/cancel-subscription';
import { removeContactFromCommunity } from '../src/lib/actions/remove-contact-from-community';
import { newContact } from '../src/lib/triggers/new-contact';
import { newSale } from '../src/lib/triggers/new-sale';
import { newTagAddedToContact } from '../src/lib/triggers/new-tag-added-to-contact';
import { contactTagRemoved } from '../src/lib/triggers/contact-tag-removed';
import { newOptIn } from '../src/lib/triggers/new-opt-in';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

const CONTACT = {
  id: 501,
  email: 'jane@example.com',
  fields: [{ fieldName: 'First name', slug: 'first_name', value: 'Jane' }],
  tags: [{ id: 7, name: 'vip' }],
};

beforeEach(() => {
  sendRequest.mockReset();
});

describe('webhook signature (B6)', () => {
  const secret = 'webhook-secret';

  it('matches the normalized payload from the systeme.io docs byte for byte', () => {
    const original = {
      contact: {
        id: 123,
        sourceURL: 'http://example.com',
        fields: [{ fieldName: 'Prénom', slug: 'first_name', value: 'Jean' }],
      },
    };
    expect(systemeIoInput.phpJsonEncode(original)).toBe(
      '{"contact":{"id":123,"sourceURL":"http:\\/\\/example.com","fields":[{"fieldName":"Pr\\u00e9nom","slug":"first_name","value":"Jean"}]}}',
    );
  });

  it('escapes astral characters as a lowercase surrogate pair', () => {
    expect(systemeIoInput.phpJsonEncode({ v: '😀' })).toBe('{"v":"\\ud83d\\ude00"}');
  });

  it('accepts a signature over the raw body (today\'s behaviour)', () => {
    const raw = '{"contact":{"id":1,"email":"a@b.co"}}';
    expect(systemeIoCommon.verifyWebhookSignature({ secret: secret, signatureHeader: sign({ secret, body: raw }), rawBody: raw })).toBe(true);
  });

  it('accepts a signature over the PHP-normalized body when the raw body has unescaped accents and slashes', () => {
    const raw = '{\n  "contact": {"id": 1, "sourceURL": "https://x.io/p", "fields": [{"fieldName": "Prénom", "value": "Zoë"}]}\n}';
    const normalized = '{"contact":{"id":1,"sourceURL":"https:\\/\\/x.io\\/p","fields":[{"fieldName":"Pr\\u00e9nom","value":"Zo\\u00eb"}]}}';
    expect(systemeIoCommon.verifyWebhookSignature({ secret: secret, signatureHeader: sign({ secret, body: normalized }), rawBody: raw })).toBe(true);
  });

  it('accepts an upper-case hex signature', () => {
    const raw = '{"a":1}';
    expect(systemeIoCommon.verifyWebhookSignature({ secret: secret, signatureHeader: sign({ secret, body: raw }).toUpperCase(), rawBody: raw })).toBe(true);
  });

  it('rejects a wrong secret, a tampered body, a missing header, a missing secret and non-hex junk', () => {
    const raw = '{"a":1}';
    const good = sign({ secret, body: raw });
    expect(systemeIoCommon.verifyWebhookSignature({ secret: 'other', signatureHeader: good, rawBody: raw })).toBe(false);
    expect(systemeIoCommon.verifyWebhookSignature({ secret: secret, signatureHeader: good, rawBody: '{"a":2}' })).toBe(false);
    expect(systemeIoCommon.verifyWebhookSignature({ secret: secret, signatureHeader: undefined, rawBody: raw })).toBe(false);
    expect(systemeIoCommon.verifyWebhookSignature({ secret: undefined, signatureHeader: good, rawBody: raw })).toBe(false);
    expect(systemeIoCommon.verifyWebhookSignature({ secret: secret, signatureHeader: 'zz', rawBody: raw })).toBe(false);
  });
});

describe('webhook triggers', () => {
  const secret = 'abc123';
  const body = { contact: { ...CONTACT } };
  const raw = JSON.stringify(body);

  function delivery({ signature, messageId }: { signature?: string; messageId?: string }) {
    const headers: Record<string, string> = {};
    if (signature) headers['x-webhook-signature'] = signature;
    if (messageId) headers['x-webhook-message-id'] = messageId;
    return { headers, body, rawBody: raw };
  }

  it('newContact still returns the unwrapped contact for a valid delivery', async () => {
    const { store } = memoryStore({ new_contact_webhook_secret: secret });
    const result = await runHook({ trigger: newContact, hook: 'run', context: {
      store,
      payload: delivery({ signature: sign({ secret, body: raw }), messageId: 'm1' }),
    } });
    expect(result).toEqual([CONTACT]);
  });

  it('a bad signature throws visibly (with the message id) instead of silently returning []', async () => {
    const { store } = memoryStore({ new_contact_webhook_secret: secret });
    await expect(
      runHook({ trigger: newContact, hook: 'run', context: { store, payload: delivery({ signature: 'deadbeef', messageId: 'm-bad' }) } }),
    ).rejects.toThrow(/signature does not match \(message id m-bad\)/);
  });

  it('a delivery with no stored secret throws with a re-publish hint', async () => {
    const { store } = memoryStore();
    await expect(
      runHook({ trigger: newSale, hook: 'run', context: { store, payload: delivery({ signature: sign({ secret, body: raw }) }) } }),
    ).rejects.toThrow(/no webhook secret/);
  });

  it('drops a retry of the same X-Webhook-Message-Id', async () => {
    const { store } = memoryStore({ new_contact_webhook_secret: secret });
    const payload = delivery({ signature: sign({ secret, body: raw }), messageId: 'dup-1' });
    expect(await runHook({ trigger: newContact, hook: 'run', context: { store, payload } })).toHaveLength(1);
    expect(await runHook({ trigger: newContact, hook: 'run', context: { store, payload } })).toEqual([]);
  });

  it('keeps the last 200 message ids, so a retry within that window is still dropped', async () => {
    const { store, data } = memoryStore({ new_contact_webhook_secret: secret });
    for (let i = 0; i < 205; i++) {
      await runHook({ trigger: newContact, hook: 'run', context: { store, payload: delivery({ signature: sign({ secret, body: raw }), messageId: `m${i}` }) } });
    }
    const seen = data.get('new_contact_seen_message_ids');
    expect(Array.isArray(seen) && seen.length).toBe(200);
    const retry = delivery({ signature: sign({ secret, body: raw }), messageId: 'm60' });
    expect(await runHook({ trigger: newContact, hook: 'run', context: { store, payload: retry } })).toEqual([]);
  });

  it('newTagAddedToContact fires for every tag when the filter is unset, and only for the chosen tag when set (B5)', async () => {
    const tagBody = { contact: CONTACT, tag: { id: 7, name: 'vip' } };
    const tagRaw = JSON.stringify(tagBody);
    const payload = { headers: { 'x-webhook-signature': sign({ secret, body: tagRaw }) }, body: tagBody, rawBody: tagRaw };
    const { store } = memoryStore({ new_tag_added_webhook_secret: secret });
    expect(await runHook({ trigger: newTagAddedToContact, hook: 'run', context: { store, payload, propsValue: {} } })).toEqual([tagBody]);
    expect(await runHook({ trigger: newTagAddedToContact, hook: 'run', context: { store, payload, propsValue: { tag: 7 } } })).toEqual([tagBody]);
    expect(await runHook({ trigger: newTagAddedToContact, hook: 'run', context: { store, payload, propsValue: { tag: 8 } } })).toEqual([]);
  });

  it('contact_tag_removed unwraps the documented contact.contact nesting', async () => {
    const nested = { contact: { contact: CONTACT }, tag: { id: 2, name: 'old' } };
    const nestedRaw = JSON.stringify(nested);
    const { store } = memoryStore({ contact_tag_removed_webhook_secret: secret });
    const result = await runHook({ trigger: contactTagRemoved, hook: 'run', context: {
      store,
      payload: { headers: { 'x-webhook-signature': sign({ secret, body: nestedRaw }) }, body: nested, rawBody: nestedRaw },
    } });
    expect(result).toEqual([{ contact: CONTACT, tag: { id: 2, name: 'old' } }]);
  });

  it('new_opt_in returns the contact', async () => {
    const { store } = memoryStore({ new_opt_in_webhook_secret: secret });
    const result = await runHook({ trigger: newOptIn, hook: 'run', context: { store, payload: delivery({ signature: sign({ secret, body: raw }) }) } });
    expect(result).toEqual([CONTACT]);
  });

  it('onEnable subscribes with the event name and stores id + secret under the original keys', async () => {
    const { store, data } = memoryStore();
    ok({ body: { id: 'wh_1' }, status: 201 });
    await runHook({ trigger: newTagAddedToContact, hook: 'onEnable', context: { store } });
    const req = request(0);
    expect(req.method).toBe('POST');
    expect(req.url).toBe(`${BASE}/webhooks`);
    expect(req.body.subscriptions).toEqual([{ event: 'CONTACT_TAG_ADDED', schemaVersion: 1 }]);
    expect(req.body.url).toBe('https://ap.example.com/v1/webhooks/abc');
    expect(data.get('new_tag_added_webhook_id')).toBe('wh_1');
    expect(data.get('new_tag_added_webhook_secret')).toBe(req.body.secret);
  });

  it('onEnable names the webhook after the flow, the same on every enable, with a test suffix while testing', async () => {
    ok({ body: { id: 'wh_a' }, status: 201 });
    await runHook({ trigger: newContact, hook: 'onEnable', context: { store: memoryStore().store } });
    ok({ body: { id: 'wh_b' }, status: 201 });
    await runHook({ trigger: newContact, hook: 'onEnable', context: { store: memoryStore().store } });
    ok({ body: { id: 'wh_c' }, status: 201 });
    await runHook({
      trigger: newContact,
      hook: 'onEnable',
      context: { store: memoryStore().store, webhookUrl: 'https://ap.example.com/api/v1/webhooks/abc/test' },
    });
    ok({ body: { id: 'wh_d' }, status: 201 });
    await runHook({
      trigger: newContact,
      hook: 'onEnable',
      context: { store: memoryStore().store, webhookUrl: 'https://ap.example.com/api/v1/webhooks/other' },
    });
    expect(request(0).body.name).toBe('Activepieces Webhook - CONTACT_CREATED - abc');
    expect(request(1).body.name).toBe('Activepieces Webhook - CONTACT_CREATED - abc');
    expect(request(2).body.name).toBe('Activepieces Webhook - CONTACT_CREATED - abc-test');
    expect(request(3).body.name).toBe('Activepieces Webhook - CONTACT_CREATED - other');
  });

  it('onEnable replaces a stale webhook that already points at this flow url, then retries', async () => {
    const { store, data } = memoryStore();
    fail({ status: 422, body: { detail: 'url: This value is already used.', violations: [{ propertyPath: 'url', message: 'This value is already used.' }] } });
    ok({ body: { items: [
      { id: 'wh_other', url: 'https://ap.example.com/v1/webhooks/zzz' },
      { id: 'wh_stale', url: 'https://ap.example.com/v1/webhooks/abc' },
    ], hasMore: false } });
    ok({ body: undefined, status: 204 });
    ok({ body: { id: 'wh_new' }, status: 201 });
    await runHook({ trigger: contactTagRemoved, hook: 'onEnable', context: { store } });
    expect(request(1).method).toBe('GET');
    expect(request(2).method).toBe('DELETE');
    expect(request(2).url).toBe(`${BASE}/webhooks/wh_stale`);
    expect(request(3).method).toBe('POST');
    expect(sendRequest).toHaveBeenCalledTimes(4);
    expect(data.get('contact_tag_removed_webhook_id')).toBe('wh_new');
  });

  it('onEnable replaces this flow\'s leftover webhook on a name clash (old tunnel url), keeping other webhooks', async () => {
    const { store, data } = memoryStore();
    fail({ status: 422, body: { detail: 'name: This value is already used.', violations: [{ propertyPath: 'name', message: 'This value is already used.' }] } });
    ok({ body: { items: [
      { id: 'wh_legacy', name: 'Activepieces Webhook - CONTACT_CREATED', url: 'https://dead-tunnel.example/v1/webhooks/zzz' },
      { id: 'wh_other_flow', name: 'Activepieces Webhook - CONTACT_CREATED - zzz', url: 'https://ap.example.com/v1/webhooks/zzz' },
      { id: 'wh_ours', name: 'Activepieces Webhook - CONTACT_CREATED - abc', url: 'https://dead-tunnel.example/v1/webhooks/abc' },
    ], hasMore: false } });
    fail({ status: 404, body: { detail: 'Not Found' } });
    ok({ body: { id: 'wh_new' }, status: 201 });
    await runHook({ trigger: newContact, hook: 'onEnable', context: { store } });
    expect(sendRequest).toHaveBeenCalledTimes(4);
    expect(request(2).method).toBe('DELETE');
    expect(request(2).url).toBe(`${BASE}/webhooks/wh_ours`);
    expect(request(3).method).toBe('POST');
    expect(data.get('new_contact_webhook_id')).toBe('wh_new');
  });

  it('onEnable rethrows a name clash when no webhook belongs to this flow', async () => {
    fail({ status: 422, body: { detail: 'name: This value is already used.', violations: [{ propertyPath: 'name', message: 'This value is already used.' }] } });
    ok({ body: { items: [{ id: 'wh_x', name: 'Something else', url: 'https://elsewhere.example/hook' }], hasMore: false } });
    await expect(runHook({ trigger: newContact, hook: 'onEnable', context: { store: memoryStore().store } })).rejects.toThrow(/422: name: This value is already used/);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(1).method).toBe('GET');
  });

  it('onEnable rethrows other 422s without touching existing webhooks', async () => {
    fail({ status: 422, body: { detail: 'subscriptions: This value is not valid.', violations: [{ propertyPath: 'subscriptions', message: 'This value is not valid.' }] } });
    await expect(runHook({ trigger: newContact, hook: 'onEnable', context: { store: memoryStore().store } })).rejects.toThrow(/422: subscriptions: This value is not valid/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('contact_tag_removed passes the live single-nested payload through unchanged', async () => {
    const live = { contact: { ...CONTACT, tags: [] }, tag: { id: 7, name: 'vip' } };
    const liveRaw = JSON.stringify(live);
    const { store } = memoryStore({ contact_tag_removed_webhook_secret: secret });
    const result = await runHook({ trigger: contactTagRemoved, hook: 'run', context: {
      store,
      payload: { headers: { 'x-webhook-signature': sign({ secret, body: liveRaw }) }, body: live, rawBody: liveRaw },
    } });
    expect(result).toEqual([live]);
  });

  it('onEnable deletes the webhook it created when storing fails', async () => {
    ok({ body: { id: 'wh_2' }, status: 201 });
    ok({ body: undefined, status: 204 });
    const store = {
      put: async () => {
        throw new Error('store down');
      },
      get: async () => null,
      delete: async () => undefined,
    };
    await expect(runHook({ trigger: newContact, hook: 'onEnable', context: { store } })).rejects.toThrow('store down');
    expect(request(1).method).toBe('DELETE');
    expect(request(1).url).toBe(`${BASE}/webhooks/wh_2`);
  });

  it('onDisable treats 404 as deleted and clears the store (B9)', async () => {
    const { store, data } = memoryStore({ new_sale_webhook_id: 'wh_3', new_sale_webhook_secret: 's' });
    fail({ status: 404, body: { detail: 'Not Found' } });
    await runHook({ trigger: newSale, hook: 'onDisable', context: { store } });
    expect(data.get('new_sale_webhook_id')).toBeNull();
    expect(data.get('new_sale_webhook_secret')).toBeNull();
  });

  it('onDisable keeps the id when the delete fails for another reason', async () => {
    const { store, data } = memoryStore({ new_sale_webhook_id: 'wh_4', new_sale_webhook_secret: 's' });
    fail({ status: 500, body: { detail: 'boom' } });
    await expect(runHook({ trigger: newSale, hook: 'onDisable', context: { store } })).rejects.toThrow(/500/);
    expect(data.get('new_sale_webhook_id')).toBe('wh_4');
  });
});

describe('Find Contact by Email (B1)', () => {
  it('uses the exact email filter: one request on a hit, same output keys', async () => {
    ok({ body: { items: [CONTACT], hasMore: false } });
    const result = await runAction({ action: findContactByEmail, props: { email: ' jane@example.com ' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).url).toBe(`${BASE}/contacts`);
    expect(request(0).queryParams).toEqual({ email: 'jane@example.com', limit: '10' });
    expect(request(0).headers['X-API-Key']).toBe(API_KEY);
    expect(result).toEqual({ success: true, contact: CONTACT, message: 'Contact found successfully' });
  });

  it('sends a mixed-case email as typed and matches ignoring case (the filter ignores case, Tier-2)', async () => {
    ok({ body: { items: [CONTACT], hasMore: false } });
    const result = await runAction({ action: findContactByEmail, props: { email: 'Jane@Example.com' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).queryParams.email).toBe('Jane@Example.com');
    expect(result).toMatchObject({ success: true, contact: CONTACT });
  });

  it('a miss costs one request, with no scan of every contact', async () => {
    ok({ body: { items: [], hasMore: false } });
    expect(await runAction({ action: findContactByEmail, props: { email: 'Nobody@Example.com' } })).toMatchObject({ success: false });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('returns the not-found shape on a miss', async () => {
    ok({ body: { items: [], hasMore: false } });
    expect(await runAction({ action: findContactByEmail, props: { email: 'nobody@example.com' } })).toEqual({
      success: false,
      contact: null,
      message: 'No contact found with email: nobody@example.com',
    });
  });
});

describe('pagination', () => {
  it('pages with startingAfter = last id, keeps order, and reports a cursor when truncated', async () => {
    ok({ body: { items: [{ id: 30 }, { id: 29 }], hasMore: true } });
    ok({ body: { items: [{ id: 28 }, { id: 27 }], hasMore: true } });
    const result = await systemeIoCommon.paginate<{ id: number }>({
      auth: API_KEY,
      url: '/tags',
      query: { order: 'asc' },
      maxItems: 3,
    });
    expect(request(0).queryParams).toEqual({ order: 'asc', limit: '100' });
    expect(request(1).queryParams).toEqual({ order: 'asc', limit: '100', startingAfter: '29' });
    expect(result).toEqual({ items: [{ id: 30 }, { id: 29 }, { id: 28 }], hasMore: true, nextCursor: 28 });
  });

  it('retries with a smaller page when the endpoint rejects the limit', async () => {
    fail({ status: 422, body: {
      detail: 'pagination.limit: Wrong value of pagination limit parameter',
      violations: [{ propertyPath: 'pagination.limit', message: 'Wrong value of pagination limit parameter' }],
    } });
    ok({ body: { items: [{ id: 9 }], hasMore: false } });
    const result = await systemeIoCommon.paginate({ auth: API_KEY, url: '/payment/subscriptions', query: { contact: 3 }, maxItems: 1000 });
    expect(request(0).queryParams.limit).toBe('100');
    expect(request(1).queryParams).toEqual({ contact: '3', limit: '50' });
    expect(result).toEqual({ items: [{ id: 9 }], hasMore: false, nextCursor: null });
  });

  it('does not retry other 422s', async () => {
    fail({ status: 422, body: { detail: 'contact: This value should be positive.' } });
    await expect(systemeIoCommon.paginate({ auth: API_KEY, url: '/payment/subscriptions', maxItems: 10 })).rejects.toThrow(/should be positive/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('stops when hasMore is false', async () => {
    ok({ body: { items: [{ id: 5 }], hasMore: false } });
    const result = await systemeIoCommon.paginate({ auth: API_KEY, url: '/tags', maxItems: 1000 });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ items: [{ id: 5 }], hasMore: false, nextCursor: null });
  });

  it('clamps the page size to the documented 10-100 range', async () => {
    ok({ body: { items: [], hasMore: false } });
    await systemeIoCommon.paginate({ auth: API_KEY, url: '/tags', maxItems: 5, pageSize: 5 });
    expect(request(0).queryParams.limit).toBe('10');
  });

  it('getTags pages past 100 tags (B2)', async () => {
    ok({ body: { items: Array.from({ length: 100 }, (_, i) => ({ id: 200 - i, name: `t${i}` })), hasMore: true } });
    ok({ body: { items: [{ id: 50, name: 'last' }], hasMore: false } });
    const { items } = await systemeIoCommon.getTags({ auth: API_KEY });
    expect(items).toHaveLength(101);
  });

  it('find_contacts maps filters and returns a continuation cursor', async () => {
    ok({ body: { items: [CONTACT, { ...CONTACT, id: 500 }], hasMore: true } });
    const result = await runAction({ action: findContacts, props: {
      tag_ids: ['7', 8],
      unsubscribed: 'no',
      bounced: undefined,
      registered_after: '2026-01-01T00:00:00Z',
      max_results: 2,
    } });
    expect(request(0).queryParams).toEqual({
      tags: '7,8',
      unsubscribed: 'false',
      registeredAfter: '2026-01-01T00:00:00.000Z',
      limit: '100',
    });
    expect(result).toMatchObject({ count: 2, has_more: true, next_cursor: 500 });
  });

  it('rejects ids that are not positive integers before any request', async () => {
    await expect(runAction({ action: deleteContact, props: { contact_id: '../webhooks/1' } })).rejects.toThrow(/positive whole number/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('errors (B8)', () => {
  it('surfaces 422 violations', async () => {
    fail({ status: 422, body: {
      detail: 'email: This value is already used.',
      violations: [{ propertyPath: 'email', message: 'This value is already used.', code: 'x' }],
    } });
    await expect(
      systemeIoCommon.apiCall({ method: HttpMethod.POST, url: '/contacts', auth: API_KEY, body: { email: 'a@b.co' } }),
    ).rejects.toThrow(/^Systeme\.io API error 422: email: This value is already used\.$/);
  });

  it('keeps its own 404 text (single period, hint) and no body/error field for the engine to lift', async () => {
    fail({ status: 404, body: { title: 'An error occurred', detail: 'Not Found' } });
    const error = await systemeIoCommon
      .apiCall({ method: HttpMethod.GET, url: '/tags/1', auth: API_KEY })
      .catch((e: unknown) => e);
    if (!(error instanceof Error)) {
      throw new Error('expected an Error');
    }
    expect(error.message).toBe('Systeme.io API error 404: Not Found. The record was not found; check the id.');
    expect(Reflect.get(error, 'body')).toBeUndefined();
    expect(Reflect.get(error, 'error')).toBeUndefined();
  });

  it('tells a 401 (bad key) apart from a 403 (no access to this record)', async () => {
    fail({ status: 401, body: { detail: 'Unauthorized' } });
    await expect(systemeIoCommon.apiCall({ method: HttpMethod.GET, url: '/tags', auth: API_KEY })).rejects.toThrow(/401: Unauthorized\. Check that the API key is valid/);
    fail({ status: 403, body: { detail: 'Forbidden' } });
    const error = await systemeIoCommon
      .apiCall({ method: HttpMethod.POST, url: '/payment/subscriptions/1/cancel', auth: API_KEY, body: {} })
      .catch((e: unknown) => e);
    if (!(error instanceof Error)) {
      throw new Error('expected an Error');
    }
    expect(error.message).toBe('Systeme.io API error 403: Forbidden. This API key may not access this record or feature; check the id and your Systeme.io plan.');
  });

  it('adds a rate-limit hint on 429', async () => {
    fail({ status: 429, body: { detail: 'Too many requests' } });
    await expect(systemeIoCommon.apiCall({ method: HttpMethod.GET, url: '/tags', auth: API_KEY })).rejects.toThrow(/Rate limited/);
  });
});

describe('contact dropdown', () => {
  it('shows no options for an unknown id, but a disabled error for other failures', async () => {
    fail({ status: 404, body: { detail: 'Not Found' } });
    expect(await contactDropdownOptions({ apiKey: API_KEY, searchValue: '999' })).toMatchObject({ disabled: false, options: [] });
    fail({ status: 401, body: { detail: 'Invalid API key' } });
    const state = await contactDropdownOptions({ apiKey: API_KEY, searchValue: '999' });
    expect(state.disabled).toBe(true);
    expect(state.placeholder).toMatch(/401/);
  });
});

describe('Update Contact locale (B7)', () => {
  it('does not send locale when unset (unchanged request)', async () => {
    ok({ body: CONTACT });
    await runAction({ action: updateContact, props: { contactId: 501, customFields: [{ fieldSlug: 'country', fieldValue: 'US' }] } });
    expect(request(0).body).toEqual({ fields: [{ slug: 'country', value: 'US' }] });
    expect(request(0).headers['Content-Type']).toBe('application/merge-patch+json');
  });

  it('sends locale when set, even with no fields', async () => {
    ok({ body: CONTACT });
    await runAction({ action: updateContact, props: { contactId: 501, locale: 'fr' } });
    expect(request(0).body).toEqual({ locale: 'fr' });
  });
});

describe('both actions', () => {
  it('delete_contact converges on 404', async () => {
    fail({ status: 404, body: { detail: 'Not Found' } });
    expect(await runAction({ action: deleteContact, props: { contact_id: 501 } })).toEqual({ deleted: false, not_found: true, id: 501 });
  });

  it('create_tag returns the existing tag (exact, case-insensitive) without creating', async () => {
    ok({ body: { items: [{ id: 3, name: 'Webinar 2026 extra' }, { id: 4, name: 'webinar 2026', createdAt: '2026-01-01T00:00:00+00:00' }], hasMore: false } });
    const result = await runAction({ action: createTag, props: { name: ' Webinar 2026 ' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).queryParams.query).toBe('Webinar 2026');
    expect(result).toEqual({ id: 4, name: 'webinar 2026', created_at: '2026-01-01T00:00:00+00:00', created: false });
  });

  it('create_tag creates when no exact match exists, and refuses names over 64 chars', async () => {
    ok({ body: { items: [{ id: 3, name: 'Webinar 2026 extra' }], hasMore: false } });
    ok({ body: { id: 9, name: 'Webinar 2026', createdAt: 'x' }, status: 201 });
    expect(await runAction({ action: createTag, props: { name: 'Webinar 2026' } })).toMatchObject({ id: 9, created: true });
    expect(request(1).body).toEqual({ name: 'Webinar 2026' });
    await expect(runAction({ action: createTag, props: { name: 'x'.repeat(65) } })).rejects.toThrow(/64/);
  });

  it('find_contacts and enroll_contact_in_course send id lists as numbers and refuse a non-list before any request', async () => {
    ok({ body: { items: [], hasMore: false } });
    await runAction({ action: findContacts, props: { tag_ids: [7, '8'] } });
    expect(request(0).queryParams.tags).toBe('7,8');
    ok({ body: { id: 78, accessType: 'partial_access', course: { id: 1 }, contact: { id: 2 } }, status: 201 });
    await runAction({ action: enrollContactInCourse, props: { course_id: 1, contact_id: 2, access_type: 'partial_access', modules: ['5', 6] } });
    expect(request(1).body).toEqual({ contactId: 2, accessType: 'partial_access', modules: [5, 6] });
    await expect(runAction({ action: findContacts, props: { tag_ids: '7' } })).rejects.toThrow(/must be a list of ids/);
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('enroll_contact_in_course requires modules for partial access and omits them for full access', async () => {
    await expect(
      runAction({ action: enrollContactInCourse, props: { course_id: 1, contact_id: 2, access_type: 'partial_access', modules: [] } }),
    ).rejects.toThrow(/at least one module/);
    ok({ body: { id: 77, accessType: 'full_access', active: true, course: { id: 1, name: 'C' }, contact: { id: 2, email: 'a@b.co' } }, status: 201 });
    const result = await runAction({ action: enrollContactInCourse, props: { course_id: 1, contact_id: 2, access_type: 'full_access', modules: [5] } });
    expect(request(0).url).toBe(`${BASE}/school/courses/1/enrollments`);
    expect(request(0).body).toEqual({ contactId: 2, accessType: 'full_access' });
    expect(result).toEqual({
      id: 77,
      access_type: 'full_access',
      active: true,
      course_id: 1,
      course_name: 'C',
      contact_id: 2,
      contact_email: 'a@b.co',
    });
  });

  it('remove_course_enrollment deletes only rows matching both course and contact', async () => {
    ok({ body: {
      items: [
        { id: 10, course: { id: 1 }, contact: { id: 2 } },
        { id: 11, course: { id: 99 }, contact: { id: 2 } },
      ],
      hasMore: false,
    } });
    ok({ body: undefined, status: 204 });
    const result = await runAction({ action: removeCourseEnrollment, props: { course_id: 1, contact_id: 2 } });
    expect(request(0).queryParams).toEqual({ course: '1', contact: '2', limit: '100' });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(1).url).toBe(`${BASE}/school/enrollments/10`);
    expect(result).toEqual({ removed: true, removed_count: 1, removed_ids: [10], not_found: false });
  });

  it('remove_course_enrollment and remove_contact_from_community refuse a truncated list before deleting anything', async () => {
    const page = (start: number) => ({ items: Array.from({ length: 100 }, (_, i) => ({ id: start - i, course: { id: 9 }, contact: { id: 9 } })), hasMore: true });
    for (let i = 0; i < 10; i++) ok({ body: page(5000 - i * 100) });
    await expect(runAction({ action: removeCourseEnrollment, props: { course_id: 1, contact_id: 2 } })).rejects.toThrow(/more than 1,000 matching rows/);
    expect(sendRequest).toHaveBeenCalledTimes(10);
    expect(sendRequest.mock.calls.every((call) => call[0].method === 'GET')).toBe(true);

    sendRequest.mockReset();
    for (let i = 0; i < 10; i++) ok({ body: page(5000 - i * 100) });
    await expect(runAction({ action: removeContactFromCommunity, props: { community_id: 1, contact_id: 2 } })).rejects.toThrow(/Nothing was removed/);
    expect(sendRequest.mock.calls.every((call) => call[0].method === 'GET')).toBe(true);
  });

  it('remove_course_enrollment reports not_found and deletes nothing when there is no match', async () => {
    ok({ body: { items: [{ id: 11, course: { id: 99 }, contact: { id: 2 } }], hasMore: false } });
    expect(await runAction({ action: removeCourseEnrollment, props: { course_id: 1, contact_id: 2 } })).toMatchObject({ not_found: true, removed_count: 0 });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('add_contact_to_community returns queued on 202', async () => {
    ok({ body: {}, status: 202 });
    expect(await runAction({ action: addContactToCommunity, props: { community_id: 3, contact_id: 2 } })).toEqual({
      queued: true,
      community_id: 3,
      contact_id: 2,
    });
    expect(request(0).body).toEqual({ contactId: 2 });
  });

  it('cancel_subscription checks the subscription belongs to the contact, then cancels at the end of the period by default', async () => {
    ok({ body: { items: [{ id: 40, status: 'active', cancelledAt: null }], hasMore: false } });
    ok({ body: undefined, status: 204 });
    expect(await runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 40 } })).toEqual({
      cancelled: true,
      already_cancelled: false,
      subscription_id: 40,
      contact_id: 2,
      cancel_type: 'WhenBillingPeriodEnds',
    });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(0).url).toBe(`${BASE}/payment/subscriptions`);
    expect(request(0).queryParams).toEqual({ contact: '2', limit: '100' });
    expect(request(1).method).toBe('POST');
    expect(request(1).url).toBe(`${BASE}/payment/subscriptions/40/cancel`);
    expect(request(1).body).toEqual({ cancel: 'WhenBillingPeriodEnds' });
  });

  it('cancel_subscription refuses a subscription of another contact without cancelling anything', async () => {
    ok({ body: { items: [{ id: 41, status: 'active', cancelledAt: null }], hasMore: false } });
    await expect(runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 999 } })).rejects.toThrow(
      /Subscription 999 does not belong to contact 2, so nothing was cancelled/,
    );
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).method).toBe('GET');
  });

  it('cancel_subscription reports an already cancelled subscription without a second cancel', async () => {
    ok({ body: { items: [{ id: 40, status: 'cancelled', cancelledAt: '2026-09-01T00:00:00+00:00' }], hasMore: false } });
    expect(await runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 40, cancel: 'Now' } })).toMatchObject({
      cancelled: true,
      already_cancelled: true,
      cancel_type: 'Now',
    });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('cancel_subscription still sends the cancel for a scheduled end, and converges on its 422 only for the end-of-period option', async () => {
    const scheduled = [{ id: 40, status: 'active', cancelledAt: '2026-09-01T00:00:00+00:00' }];
    ok({ body: { items: scheduled, hasMore: false } });
    ok({ body: undefined, status: 204 });
    expect(await runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 40 } })).toMatchObject({
      cancelled: true,
      already_cancelled: false,
    });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(1).body).toEqual({ cancel: 'WhenBillingPeriodEnds' });

    sendRequest.mockReset();
    ok({ body: { items: scheduled, hasMore: false } });
    fail({ status: 422, body: { detail: 'Subscription is already cancelled' } });
    ok({ body: { items: scheduled, hasMore: false } });
    expect(await runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 40 } })).toMatchObject({ already_cancelled: true });

    sendRequest.mockReset();
    ok({ body: { items: scheduled, hasMore: false } });
    fail({ status: 422, body: { detail: 'Subscription is already cancelled' } });
    ok({ body: { items: scheduled, hasMore: false } });
    await expect(runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 40, cancel: 'Now' } })).rejects.toThrow(
      /422: Subscription is already cancelled/,
    );
    expect(request(1).body).toEqual({ cancel: 'Now' });
  });

  it('cancel_subscription keeps the original 422 when the follow-up read fails, and rethrows it for an active subscription', async () => {
    ok({ body: { items: [{ id: 40, status: 'active', cancelledAt: null }], hasMore: false } });
    fail({ status: 422, body: { detail: 'Cannot cancel' } });
    fail({ status: 500, body: { detail: 'boom' } });
    await expect(runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 40 } })).rejects.toThrow(/422: Cannot cancel/);

    ok({ body: { items: [{ id: 40, status: 'active', cancelledAt: null }], hasMore: false } });
    fail({ status: 422, body: { detail: 'Cannot cancel' } });
    ok({ body: { items: [{ id: 40, status: 'active', cancelledAt: null }], hasMore: false } });
    await expect(runAction({ action: cancelSubscription, props: { contact_id: 2, subscription_id: 40 } })).rejects.toThrow(/422: Cannot cancel/);
  });
});
