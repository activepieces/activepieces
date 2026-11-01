import { createHmac } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOrUpdateContact } from '../src/lib/actions/create-or-update-contact';
import { buildPandaDocError, buildPandaDocUrl, fileNameFromDisposition, PandaDocApiError } from '../src/lib/common/client';
import { pandadocInputs, metadataQuery } from '../src/lib/common/inputs';
import { pandadocNormalize } from '../src/lib/common/normalize';
import { pandadocWebhook, WebhookStore } from '../src/lib/common/webhook';

const CAPTURED_BODY =
  '[{"event":"document_creation_failed","data":{"id":"Hb64Mn5FytFXm5vW9VXvPj","error":{"type":"validation_error","detail":"All field tags within PDF must be declared within \'fields\' object of the JSON Payload. No field with optId=\'like\' found in \'fields\' object, fields passed were [\'name\']"}}}]';
const CAPTURED_KEY = '9msLz7xi8zHXke6usg2uNm';
const CAPTURED_SIGNATURE = '1515a53b5f84d2ef17fb04799987c93bb546d2a3f53ea6700fc3aece76864cbf';

function memoryStore(initial: Record<string, unknown> = {}): WebhookStore & { data: Record<string, unknown> } {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    async get<T>(key: string): Promise<T | null> {
      return key in data ? Reflect.get(data, key) : null;
    },
    async put<T>(key: string, value: T): Promise<T> {
      data[key] = value;
      return value;
    },
    async delete(key: string): Promise<void> {
      delete data[key];
    },
  };
}

function stateChangedBody(status: string): string {
  return JSON.stringify([{ event: 'document_state_changed', data: { id: 'doc1', name: 'Doc', status, template: { id: 'tpl1', name: 'T' } } }]);
}

function sign({ body, key }: { body: string; key: string }): string {
  return createHmac('sha256', key).update(body).digest('hex');
}

describe('signature verification', () => {
  it('accepts the signature PandaDoc sent for a real delivery', () => {
    expect(pandadocWebhook.verifySignature({ sharedKey: CAPTURED_KEY, rawBody: CAPTURED_BODY, signature: CAPTURED_SIGNATURE })).toBe(true);
    expect(pandadocWebhook.verifySignature({ sharedKey: CAPTURED_KEY, rawBody: Buffer.from(CAPTURED_BODY), signature: CAPTURED_SIGNATURE.toUpperCase() })).toBe(true);
  });

  it('rejects a wrong key, a tampered body, a short signature or a missing raw body', () => {
    expect(pandadocWebhook.verifySignature({ sharedKey: 'other', rawBody: CAPTURED_BODY, signature: CAPTURED_SIGNATURE })).toBe(false);
    expect(pandadocWebhook.verifySignature({ sharedKey: CAPTURED_KEY, rawBody: CAPTURED_BODY + ' ', signature: CAPTURED_SIGNATURE })).toBe(false);
    expect(pandadocWebhook.verifySignature({ sharedKey: CAPTURED_KEY, rawBody: CAPTURED_BODY, signature: 'abc' })).toBe(false);
    expect(pandadocWebhook.verifySignature({ sharedKey: CAPTURED_KEY, rawBody: undefined, signature: CAPTURED_SIGNATURE })).toBe(false);
  });
});

describe('receive', () => {
  const storeKey = 'pandadoc_test_webhook';

  it('rejects unsigned deliveries once a shared key is stored', async () => {
    const store = memoryStore({ [storeKey]: { webhookId: 'w1', sharedKey: 'k1' } });
    const body = stateChangedBody('document.completed');
    const result = await pandadocWebhook.receive({
      payload: { body: JSON.parse(body), rawBody: body, headers: {}, queryParams: {} },
      store,
      storeKey,
      events: ['document_state_changed'],
    });
    expect(result).toEqual([]);
  });

  it('accepts signed deliveries and dedupes by X-PandaDoc-Webhook-Event-Id', async () => {
    const store = memoryStore({ [storeKey]: { webhookId: 'w1', sharedKey: 'k1' } });
    const body = stateChangedBody('document.completed');
    const payload = {
      body: JSON.parse(body),
      rawBody: body,
      headers: { 'X-PandaDoc-Webhook-Event-Id': 'evt-1' },
      queryParams: { signature: sign({ body, key: 'k1' }) },
    };
    const first = await pandadocWebhook.receive({ payload, store, storeKey, events: ['document_state_changed'] });
    expect(first).toHaveLength(1);
    expect(first[0].status).toBe('document.completed');
    expect(first[0].template_id).toBe('tpl1');
    expect(Reflect.get(first[0], '_dedupe_key')).toBe('evt-1:0');
    const second = await pandadocWebhook.receive({ payload, store, storeKey, events: ['document_state_changed'] });
    expect(second).toEqual([]);
  });

  it('leaves no dedupe marker when filtering fails, so a PandaDoc resend is processed', async () => {
    const store = memoryStore({ [storeKey]: { webhookId: 'w1', sharedKey: 'k1' } });
    const body = stateChangedBody('document.completed');
    const payload = {
      body: JSON.parse(body),
      rawBody: body,
      headers: { 'X-PandaDoc-Webhook-Event-Id': 'evt-2' },
      queryParams: { signature: sign({ body, key: 'k1' }) },
    };
    await expect(
      pandadocWebhook.receive({
        payload,
        store,
        storeKey,
        events: ['document_state_changed'],
        select: async () => {
          throw new Error('document lookup failed');
        },
      }),
    ).rejects.toThrow('document lookup failed');
    expect(store.data[`${storeKey}_deliveries`]).toBeUndefined();
    const resend = await pandadocWebhook.receive({ payload, store, storeKey, events: ['document_state_changed'], select: async (items) => items });
    expect(resend).toHaveLength(1);
    expect(Reflect.get(resend[0], '_dedupe_key')).toBe('evt-2:0');
    expect(store.data[`${storeKey}_deliveries`]).toEqual(['evt-2']);
    const duplicate = await pandadocWebhook.receive({ payload, store, storeKey, events: ['document_state_changed'], select: async (items) => items });
    expect(duplicate).toEqual([]);
  });

  it('keeps accepting unsigned deliveries for legacy subscriptions that only stored webhook_id', async () => {
    const store = memoryStore({ webhook_id: 'legacy-uuid' });
    const body = stateChangedBody('document.sent');
    const result = await pandadocWebhook.receive({
      payload: { body, headers: {}, queryParams: {} },
      store,
      storeKey,
      events: ['document_state_changed'],
    });
    expect(result).toHaveLength(1);
    expect(await pandadocWebhook.readStored({ store, storeKey })).toEqual({ webhookId: 'legacy-uuid', sharedKey: null });
  });

  it('ignores events the trigger did not subscribe to', async () => {
    const store = memoryStore();
    const result = await pandadocWebhook.receive({
      payload: { body: CAPTURED_BODY, headers: {}, queryParams: {} },
      store,
      storeKey,
      events: ['document_state_changed'],
    });
    expect(result).toEqual([]);
  });

  it('normalizes a creation failed delivery with its error', async () => {
    const store = memoryStore({ [storeKey]: { webhookId: 'w1', sharedKey: CAPTURED_KEY } });
    const result = await pandadocWebhook.receive({
      payload: { body: JSON.parse(CAPTURED_BODY), rawBody: CAPTURED_BODY, headers: {}, queryParams: { signature: CAPTURED_SIGNATURE } },
      store,
      storeKey,
      events: ['document_creation_failed'],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('Hb64Mn5FytFXm5vW9VXvPj');
    expect(result[0].error_type).toBe('validation_error');
    expect(result[0].error_detail).toContain("optId='like'");
  });
});

describe('client helpers', () => {
  it('builds URLs with array params and bare flags', () => {
    expect(buildPandaDocUrl({ path: '/documents', flag: 'upload' })).toBe('https://api.pandadoc.com/public/v1/documents?upload');
    expect(buildPandaDocUrl({ path: '/templates', query: { tag: ['a', 'b'], q: undefined, count: 10 } })).toBe(
      'https://api.pandadoc.com/public/v1/templates?tag=a&tag=b&count=10',
    );
    expect(() => buildPandaDocUrl({ path: '/documents/../members' })).toThrow();
  });

  it('builds readable errors without a body field', () => {
    const error = buildPandaDocError({ status: 429, responseBody: { type: 'request_error', detail: 'Too many requests' } });
    expect(error).toBeInstanceOf(PandaDocApiError);
    expect(error.message).toContain('rate limit');
    expect(error.message).toContain('Too many requests');
    expect('body' in error).toBe(false);
    expect(error.responseBody).toEqual({ type: 'request_error', detail: 'Too many requests' });
    expect(buildPandaDocError({ status: 401, responseBody: { detail: 'Key type is not permitted.' } }).message).toContain('production API key');
  });

  it('reads file names from content-disposition', () => {
    expect(fileNameFromDisposition('attachment; filename="Deal.pdf"')).toBe('Deal.pdf');
    expect(fileNameFromDisposition("attachment; filename*=UTF-8''Sales%20deal.pdf")).toBe('Sales deal.pdf');
    expect(fileNameFromDisposition('attachment; filename="../../etc/passwd"')).toBe('.._.._etc_passwd');
    expect(fileNameFromDisposition(null)).toBeNull();
  });
});

describe('inputs', () => {
  it('wraps field values by merge field name and skips empty ones', () => {
    expect(pandadocInputs.fieldValues({ name: 'Jane', agree: true, empty: '', amount: 5, nested: { value: 'x' } })).toEqual({
      name: { value: 'Jane' },
      agree: { value: true },
      amount: { value: 5 },
      nested: { value: 'x' },
    });
  });

  it('sends a checkbox field only when it was set to Checked or Unchecked', () => {
    expect(pandadocInputs.fieldValues({ agree: undefined, optIn: false, terms: true })).toEqual({
      optIn: { value: false },
      terms: { value: true },
    });
  });

  it('prefixes every metadata filter key, including ones that start with metadata_', () => {
    expect(metadataQuery({ source: 'crm', metadata_id: '7' })).toEqual({ metadata_source: 'crm', metadata_metadata_id: '7' });
  });

  it('maps recipients and requires an email or phone', () => {
    expect(pandadocInputs.recipients([{ email: 'a@example.com', role: 'custom', custom_role: 'Client', signing_order: 1 }])).toEqual([
      { email: 'a@example.com', role: 'Client', signing_order: 1 },
    ]);
    expect(() => pandadocInputs.recipients([{ first_name: 'x' }])).toThrow();
  });

  it('turns token objects and arrays into PandaDoc tokens', () => {
    expect(pandadocInputs.tokenList({ 'Client.Company': 'Acme' })).toEqual([{ name: 'Client.Company', value: 'Acme' }]);
    expect(pandadocInputs.tokenList([{ name: 'A', value: 1 }])).toEqual([{ name: 'A', value: '1' }]);
  });
});

describe('normalize', () => {
  it('reads field assignees from webhook payloads', () => {
    const field = pandadocNormalize.field({ name: 'like', merge_field: 'like', assignee: 'a@example.com', assignee_details: { email: 'a@example.com' } });
    expect(field.assigned_to_email).toBe('a@example.com');
  });
});

describe('create or update contact', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends cleared text fields as empty strings so PandaDoc clears them', async () => {
    const bodies: unknown[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body?: string }) => {
      bodies.push(JSON.parse(init.body ?? '{}'));
      return new Response(JSON.stringify({ id: 'c1', email: 'a@b.co' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }));
    await Reflect.apply(createOrUpdateContact.run, undefined, [{
      auth: { secret_text: 'key' },
      propsValue: { contact_id: 'c1', company: '', phone: '  ', city: 'Amman' },
    }]);
    expect(bodies[0]).toEqual({ company: '', phone: '', city: 'Amman' });
  });
});
