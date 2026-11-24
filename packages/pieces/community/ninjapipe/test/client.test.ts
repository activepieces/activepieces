import { afterEach, describe, expect, it, vi } from 'vitest';
import { ninjapipe } from '../src';
import { HttpMethod } from '@activepieces/pieces-common';
import { NinjaPipeApiError, ninjapipeClient, ninjapipeClock } from '../src/lib/common/client';
import { page, request, runAction, stubFetch } from './helpers';

const ID = '11111111-2222-3333-4444-555555555555';
const auth = { baseUrl: 'https://www.ninjapipe.app/api', apiKey: 'np_test' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('client', () => {
  it('trims the key and base URL from the connection', () => {
    expect(ninjapipeClient.readAuth({ props: { base_url: ' https://x.example/api/ ', api_key: ' np_1 ' } })).toEqual({ baseUrl: 'https://x.example/api', apiKey: 'np_1' });
  });

  it('retries a 429 after retryAfter seconds (clamped to 60) and then succeeds', async () => {
    const wait = vi.spyOn(ninjapipeClock, 'wait').mockResolvedValue(undefined);
    const fetchMock = stubFetch({
      responses: [
        { status: 429, body: { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED', retryAfter: 600 } },
        { status: 200, body: { data: { id: ID } } },
      ],
    });
    const result = await ninjapipeClient.getRecord({ auth, path: `/contacts/${ID}`, operation: 'get contact' });
    expect(result).toEqual({ id: ID });
    expect(wait).toHaveBeenCalledWith(60000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after two 429 retries with a readable error', async () => {
    vi.spyOn(ninjapipeClock, 'wait').mockResolvedValue(undefined);
    stubFetch({ responses: [{ status: 429, body: { error: 'Too Many Requests', retryAfter: 1 } }] });
    await expect(ninjapipeClient.getRecord({ auth, path: '/contacts/x', operation: 'get contact' })).rejects.toThrow(/HTTP 429.*100 requests per minute/);
  });

  it('throws NinjaPipeApiError with responseBody and no body field', async () => {
    stubFetch({ responses: [{ status: 400, body: { error: 'Validation Error', message: 'Unrecognized field(s): city', code: 'UNKNOWN_FIELDS', details: { fields: ['city'] } } }] });
    const error = await ninjapipeClient.getRecord({ auth, path: '/contacts/x', operation: 'get contact' }).catch((e: unknown) => e);
    if (!(error instanceof NinjaPipeApiError)) throw new Error('expected NinjaPipeApiError');
    const apiError = error;
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe('UNKNOWN_FIELDS');
    expect(apiError.message).toContain('Unrecognized field(s): city');
    expect(apiError.responseBody).toMatchObject({ code: 'UNKNOWN_FIELDS' });
    expect('body' in apiError).toBe(false);
  });

  it('explains a 403 as a missing write permission', async () => {
    stubFetch({ responses: [{ status: 403, body: { error: 'Forbidden' } }] });
    await expect(ninjapipeClient.getRecord({ auth, path: '/x', operation: 'create contact' })).rejects.toThrow(/write permission/);
  });

  it('turns an HTML 404 into a short message', async () => {
    stubFetch({ responses: [{ status: 404, body: '<!DOCTYPE html><html><pre>Cannot GET /api/x</pre></html>' }] });
    await expect(ninjapipeClient.getRecord({ auth, path: '/x', operation: 'get x' })).rejects.toThrow('NinjaPipe get x failed (HTTP 404): endpoint not found on this NinjaPipe API.');
  });

  it('refuses paths that would leave the base URL', async () => {
    await expect(ninjapipeClient.ninjapipeRequest({ auth, method: HttpMethod.GET, path: '//evil.example/x', operation: 'x' })).rejects.toThrow(/Invalid NinjaPipe API path/);
  });

  it('clamps limits to 1-100', () => {
    expect(ninjapipeClient.clampLimit({ value: 0 })).toBe(1);
    expect(ninjapipeClient.clampLimit({ value: '500' })).toBe(100);
    expect(ninjapipeClient.clampLimit({ value: undefined })).toBe(20);
  });

  it('Return All stops at the last page', async () => {
    const fetchMock = stubFetch({
      responses: [
        { status: 200, body: page({ data: [{ id: '1' }], page: 1, pages: 2, total: 2 }) },
        { status: 200, body: page({ data: [{ id: '2' }], page: 2, pages: 2, total: 2 }) },
      ],
    });
    const output = await runAction({ name: 'list_contacts', propsValue: { returnAll: true } });
    expect(output).toEqual({ items: [{ id: '1' }, { id: '2' }], count: 2, total: 2, hasMore: false, nextPage: null });
    expect(request({ fetchMock, call: 1 }).query).toMatchObject({ page: '2', limit: '100' });
  });

  it('Return All is capped and reports hasMore', async () => {
    const items = Array.from({ length: 100 }, (_, index) => ({ id: String(index) }));
    stubFetch({ responses: [{ status: 200, body: page({ data: items, pages: 999, total: 99900 }) }] });
    const result = await ninjapipeClient.listAll({ auth, path: '/contacts', operation: 'list', maxItems: 250 });
    expect(result.count).toBe(250);
    expect(result.hasMore).toBe(true);
    expect(result.nextPage).toBe(4);
  });
});

describe('three-state updates and custom fields', () => {
  it('leaves blank fields out, sends null for cleared ones and merges custom fields', async () => {
    const fetchMock = stubFetch({
      responses: [
        { status: 200, body: { data: { id: ID, fields: { keep: 'yes', drop: 'old' } } } },
        { status: 200, body: { data: { id: ID } } },
      ],
    });
    await runAction({
      name: 'update_contact',
      propsValue: { contactId: ID, firstName: '', phone: undefined, customFields: { drop: '', added: 'new' }, clearFields: ['last_name'] },
    });
    expect(request({ fetchMock, call: 0 }).method).toBe('GET');
    expect(request({ fetchMock, call: 1 }).body).toEqual({ fields: { keep: 'yes', added: 'new' }, last_name: null });
  });

  it('refuses to set and clear the same field', async () => {
    stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'update_deal', propsValue: { dealId: ID, contactId: ID, clearFields: ['contact_id'] } })).rejects.toThrow(/set and cleared/);
  });

  it('refuses an update with nothing to change', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'update_order', propsValue: { orderId: ID } })).rejects.toThrow(/Nothing to update/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends 0 and false-like values instead of dropping them', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: { data: { id: ID } } }] });
    await runAction({ name: 'update_product', propsValue: { productId: ID, price: 0, cost: 0 } });
    expect(request({ fetchMock }).body).toEqual({ price: 0, cost: 0 });
  });

  it('rejects non-numeric numbers before any request', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'ai_create_deal', propsValue: { name: 'D', value: 'abc' } })).rejects.toThrow(/Value must be a number/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('create budget needs a start or end date', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'create_budget', propsValue: { name: 'B', allocated: 1, category: 'Sales', period: 'Monthly' } })).rejects.toThrow(/Start Date/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('create pipeline rejects bad stage colors and duplicate ids', async () => {
    stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'create_pipeline', propsValue: { name: 'P', pipelineType: 'deals', stages: [{ name: 'A', color: 'red' }] } })).rejects.toThrow(/hex/);
    await expect(runAction({ name: 'create_pipeline', propsValue: { name: 'P', pipelineType: 'deals', stages: [{ name: 'A' }, { name: 'a' }] } })).rejects.toThrow(/unique/);
  });
});

describe('contact matching', () => {
  it('upsert matches the exact email, not the first fuzzy hit, and follows pages', async () => {
    const fetchMock = stubFetch({
      responses: [
        { status: 200, body: page({ data: [{ id: 'fuzzy', email: 'jane@example.com.au' }], page: 1, pages: 2 }) },
        { status: 200, body: page({ data: [{ id: 'exact', email: 'JANE@example.com' }], page: 2, pages: 2 }) },
        { status: 200, body: { data: { id: 'exact' } } },
      ],
    });
    const output = await runAction({ name: 'upsert_contact', propsValue: { email: 'jane@example.com', lastName: 'Doe' } });
    expect(output).toEqual({ action: 'updated', id: 'exact' });
    expect(request({ fetchMock, call: 0 }).query).toMatchObject({ search: 'jane@example.com', limit: '100', page: '1' });
    expect(request({ fetchMock, call: 2 })).toMatchObject({ method: 'PUT', path: '/contacts/exact' });
  });

  it('create contact in update-existing mode updates the 409 match', async () => {
    const fetchMock = stubFetch({
      responses: [
        { status: 409, body: { error: 'Conflict', code: 'DUPLICATE_EMAIL' } },
        { status: 200, body: page({ data: [{ id: 'c1', email: 'jane@example.com' }] }) },
        { status: 200, body: { data: { id: 'c1', last_name: 'Doe' } } },
      ],
    });
    const output = await runAction({ name: 'create_contact', propsValue: { email: 'jane@example.com', lastName: 'Doe', ifContactExists: 'updateExisting' } });
    expect(output).toEqual({ action: 'updated', id: 'c1', last_name: 'Doe' });
    expect(request({ fetchMock, call: 2 }).body).toEqual({ email: 'jane@example.com', last_name: 'Doe' });
  });

  it('create contact fails on a duplicate by default', async () => {
    stubFetch({ responses: [{ status: 409, body: { error: 'Conflict', message: 'Contact with this email already exists' } }] });
    await expect(runAction({ name: 'create_contact', propsValue: { email: 'jane@example.com' } })).rejects.toThrow(/HTTP 409/);
  });

  it('AI create contact names the existing contact on a duplicate email', async () => {
    stubFetch({
      responses: [
        { status: 409, body: { error: 'Conflict', code: 'DUPLICATE_EMAIL' } },
        { status: 200, body: page({ data: [{ id: 'c9', email: 'jane@example.com' }] }) },
      ],
    });
    await expect(runAction({ name: 'ai_create_contact', propsValue: { email: 'jane@example.com' } })).rejects.toThrow(/contact_id c9/);
  });

  it('add to list needs exactly one member', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'add_to_list', propsValue: { listId: ID, contactId: 'a', companyId: 'b' } })).rejects.toThrow(/exactly one/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('send to databin', () => {
  const run = (webhookUrl: string) => runAction({ name: 'send_to_databin', propsValue: { webhookUrl, payload: { a: 1 } } });

  it.each([
    'https://www.ninjapipe.app.evil.io/api/webhooks/x',
    'https://evil.io/api/webhooks/x?h=www.ninjapipe.app',
    'https://app/api/webhooks/x',
    'http://www.ninjapipe.app/api/webhooks/x',
    'https://user:pw@www.ninjapipe.app/api/webhooks/x',
    'https://www.ninjapipe.app/other/x',
  ])('refuses %s', async (url) => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(run(url)).rejects.toThrow(/Invalid webhook URL|does not match/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to the exact host or its www twin without the API key', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: { success: true } }] });
    const output = await run('https://ninjapipe.app/api/webhooks/abc');
    const sent = request({ fetchMock });
    expect(sent.url.toString()).toBe('https://ninjapipe.app/api/webhooks/abc');
    expect(sent.headers.get('authorization')).toBeNull();
    expect(sent.body).toEqual({ a: 1 });
    expect(output).toEqual({ status: 200, response: { success: true } });
  });

  it('accepts a subdomain of the connected host, like 0.1.1 did', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: {} }] });
    await run('https://acme.ninjapipe.app/api/webhooks/abc');
    expect(request({ fetchMock }).url.toString()).toBe('https://acme.ninjapipe.app/api/webhooks/abc');
  });

  it('reports invalid JSON payloads clearly', async () => {
    stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'send_to_databin', propsValue: { webhookUrl: 'https://www.ninjapipe.app/api/webhooks/a', payload: '{bad' } })).rejects.toThrow('Payload must be valid JSON.');
  });
});

describe('custom api call', () => {
  it.each(['https://evil.example/api/contacts', 'https://www.ninjapipe.app/other', '//evil.example/x', '/contacts/../../x'])('refuses %s', async (url) => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: {} }] });
    await expect(runAction({ name: 'custom_api_call', propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {} } })).rejects.toThrow(/URL must/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is human-only with aiMetadata', () => {
    const action = ninjapipe.getAction('custom_api_call');
    expect(action?.audience).toBe('human');
    expect(action?.aiMetadata?.description).toBeTruthy();
  });
});

describe('metadata', () => {
  it('every action and trigger has an outputSchema except Custom API Call', () => {
    const missing = Object.entries(ninjapipe.actions())
      .filter(([, action]) => !action.outputSchema)
      .map(([name]) => name);
    expect(missing).toEqual(['custom_api_call']);
    expect(Object.values(ninjapipe.triggers()).every((trigger) => trigger.outputSchema)).toBe(true);
  });

  it('audience counts match the plan', () => {
    const counts: Record<string, number> = {};
    Object.values(ninjapipe.actions()).forEach((action) => {
      counts[String(action.audience)] = (counts[String(action.audience)] ?? 0) + 1;
    });
    expect(counts).toEqual({ human: 21, both: 33, ai: 23 });
  });

  it('toggle client portal stays DESTRUCTIVE and not idempotent', () => {
    const action = ninjapipe.getAction('toggle_client_portal');
    expect(action?.classification).toBe('DESTRUCTIVE');
    expect(action?.aiMetadata?.idempotent).toBe(false);
  });

  it('ai actions take IDs as text, not dropdowns', () => {
    Object.values(ninjapipe.actions())
      .filter((action) => action.audience === 'ai')
      .forEach((action) => {
        Object.values(action.props).forEach((prop) => expect(prop.type).not.toBe('DROPDOWN'));
      });
  });
});
