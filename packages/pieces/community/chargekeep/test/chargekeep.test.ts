import { httpClient, HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chargekeep } from '../src';
import { chargekeepAuth } from '../src/lib/auth';
import { ChargekeepApiError, chargekeepClient } from '../src/lib/common/client';
import { newLead } from '../src/lib/triggers/new-lead';
import { newPayment } from '../src/lib/triggers/new-payment';
import { newSubscription } from '../src/lib/triggers/new-subscription';
import { DEDUPE_KEY_PROPERTY, PropertyType } from '@activepieces/pieces-framework';

type Loose = { [key: string]: Loose };

const auth = { props: { base_url: 'https://crm.chargekeep.com', api_key: 'key_123' } };

function envelope(result: unknown): HttpResponse {
  return { status: 200, headers: {}, body: { result, targetUrl: null, success: true, error: null, unAuthorizedRequest: false, __abp: true } };
}

function raw(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function abpFailure({ status, message, validationErrors }: { status: number; message: string; validationErrors?: unknown }) {
  return Object.assign(new Error('http'), {
    response: { status, headers: {}, body: { result: null, success: false, error: { code: 0, message, details: 'details text', validationErrors: validationErrors ?? null }, unAuthorizedRequest: status === 401, __abp: true } },
  });
}

function mockSeq(...items: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const item of items) {
    if (item instanceof Error) spy.mockRejectedValueOnce(item);
    else spy.mockResolvedValueOnce(envelope(item));
  }
  return spy;
}

function run({ name, propsValue }: { name: string; propsValue: Record<string, unknown> }) {
  const action = chargekeep.actions()[name];
  if (!action) throw new Error(`missing ${name}`);
  return Reflect.apply(action.run, undefined, [{ auth, propsValue }]);
}

function sent({ spy, index = 0 }: { spy: ReturnType<typeof mockSeq>; index?: number }): Loose {
  return JSON.parse(JSON.stringify(spy.mock.calls[index][0]));
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: vi.fn(async (k: string) => (data.has(k) ? data.get(k) : null)),
    put: vi.fn(async (k: string, v: unknown) => {
      data.set(k, v);
      return v;
    }),
    delete: vi.fn(async (k: string) => {
      data.delete(k);
    }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('metadata', () => {
  it('has 12 actions: 5 ai, 3 both, 4 human (incl. custom API call)', () => {
    const actions = Object.values(chargekeep.actions());
    expect(actions.length).toBe(12);
    const count = (a: string) => actions.filter((x) => (x.audience ?? 'human') === a).length;
    expect(count('ai')).toBe(5);
    expect(count('both')).toBe(3);
    expect(count('human')).toBe(4);
  });
  it('lead and subscription triggers have outputSchemas', () => {
    expect(chargekeep.triggers()['new_lead'].outputSchema?.fields.length).toBeGreaterThan(0);
    expect(chargekeep.triggers()['new_subscription'].outputSchema?.fields.length).toBeGreaterThan(0);
  });
  it('every action except custom API call has an outputSchema and aiMetadata', () => {
    for (const a of Object.values(chargekeep.actions())) {
      if (a.name === 'custom_api_call') continue;
      expect(a.outputSchema?.fields?.length, a.name).toBeGreaterThan(0);
      expect(a.aiMetadata?.description, a.name).toBeTruthy();
    }
  });
  it('ai actions take no dropdowns', () => {
    for (const a of Object.values(chargekeep.actions())) {
      if (a.audience !== 'ai') continue;
      for (const p of Object.values(a.props)) {
        expect(['DROPDOWN', 'STATIC_DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC'], a.name).not.toContain(Reflect.get(p, 'type'));
      }
    }
  });
  it('keeps action and trigger names', () => {
    expect(Object.keys(chargekeep.actions())).toEqual(expect.arrayContaining(['addOrUpdateContact', 'addOrUpdateContact(extended)', 'addOrUpdateSubscription', 'createInvoice', 'createProduct', 'getContactDetails']));
    expect(Object.keys(chargekeep.triggers()).sort()).toEqual(['new_lead', 'new_payment', 'new_subscription']);
  });
});

describe('client', () => {
  it('sends the api-key header to the connection host and unwraps result', async () => {
    const spy = mockSeq([{ id: 'C', name: 'Client' }]);
    const result = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Contact/GetContactGroups' });
    expect(result).toEqual([{ id: 'C', name: 'Client' }]);
    expect(sent({ spy }).url).toBe('https://crm.chargekeep.com/api/services/CRM/Contact/GetContactGroups');
    expect(sent({ spy }).headers['api-key']).toBe('key_123');
    expect(spy.mock.calls[0][0]).toMatchObject({ followRedirects: false });
  });
  it('throws on a 200 with success:false', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(raw({ success: false, error: { message: 'Nope' }, unAuthorizedRequest: false }));
    await expect(chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/x' })).rejects.toThrow('ChargeKeep API error (200): Nope.');
  });
  it('throws on an HTML (SPA) response', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(raw('<!DOCTYPE html>'));
    await expect(chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/x' })).rejects.toThrow('not JSON');
  });
  it('maps ABP validation errors and keeps the body in responseBody', async () => {
    mockSeq(abpFailure({ status: 400, message: 'Your request is not valid!', validationErrors: [{ message: 'The SortOrder field is required.', members: ['lines[0].SortOrder'] }] }));
    const error = await chargekeepClient.request({ auth, method: HttpMethod.POST, path: '/x', body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ChargekeepApiError);
    expect(error.message).toBe('ChargeKeep API error (400): Your request is not valid! — lines[0].SortOrder: The SortOrder field is required.');
    expect(error.status).toBe(400);
    expect(error.responseBody).toBeDefined();
    expect(Reflect.get(error, 'body')).toBeUndefined();
  });
  it('refuses unknown base URLs and absolute paths', async () => {
    await expect(chargekeepClient.request({ auth: { props: { base_url: 'https://crm.chargekeep.com.evil.io', api_key: 'k' } }, method: HttpMethod.GET, path: '/x' })).rejects.toThrow('unknown Base URL');
    await expect(chargekeepClient.request({ auth, method: HttpMethod.GET, path: '//evil.io/x' })).rejects.toThrow('relative');
    await expect(chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/a/../b' })).rejects.toThrow('..');
  });
});

describe('auth.validate', () => {
  const validate = (a: unknown) => Reflect.apply(Reflect.get(chargekeepAuth, 'validate'), undefined, [{ auth: a }]);
  it('valid on 200', async () => {
    mockSeq([]);
    await expect(validate(auth.props)).resolves.toEqual({ valid: true });
  });
  it('invalid credentials only on 401', async () => {
    mockSeq(abpFailure({ status: 401, message: 'Current user did not login to the application!' }));
    await expect(validate(auth.props)).resolves.toEqual({ valid: false, error: 'Invalid API key for the selected Base URL.' });
    mockSeq(abpFailure({ status: 500, message: 'boom' }));
    const r = await validate(auth.props);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('boom');
  });
});

describe('custom API call', () => {
  const mapping = async (url: string) => {
    const action = chargekeep.actions()['custom_api_call'];
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(raw({}));
    await Reflect.apply(action.run, undefined, [{ auth, propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {}, failsafe: false } }]);
    return spy;
  };
  it('sends relative URLs to the connection host with the api-key header', async () => {
    const spy = await mapping('/api/services/CRM/Contact/GetContactGroups');
    expect(sent({ spy }).url).toBe('https://crm.chargekeep.com/api/services/CRM/Contact/GetContactGroups');
    expect(sent({ spy }).headers['api-key']).toBe('key_123');
  });
  it('refuses another host, lookalikes and userinfo', async () => {
    for (const url of ['https://evil.io/x', 'https://crm.chargekeep.com.evil.io/x', '//evil.io/x', 'https://user@crm.chargekeep.com/x', '/a/../../x']) {
      await expect(mapping(url), url).rejects.toThrow();
      vi.restoreAllMocks();
    }
  });
});

describe('contacts', () => {
  it('extended: nickName/nameSuffix, jobTitle/isEmployed, calendly/zoom are not swapped; star top-level; contactId 0 not sent', async () => {
    const spy = mockSeq({ contactId: 5, leadId: 6 });
    const out = await run({ name: 'addOrUpdateContact(extended)', propsValue: {
      importType: 'Lead',
      contactId: 0,
      firstName: 'A',
      nickName: 'Nick',
      nameSuffix: 'Jr',
      jobTitle: 'CEO',
      isEmployed: true,
      companyCalendlyUrl: 'https://calendly.com/x',
      companyZoomUrl: 'https://zoom.us/x',
      star: 'Yellow',
      createUser: false,
      sendWelcomeEmail: false,
    } });
    const body = sent({ spy }).body;
    expect(sent({ spy }).url).toBe('https://crm.chargekeep.com/api/services/CRM/Import/ImportContact');
    expect(body.personalInfo.fullName).toEqual({ firstName: 'A', nickName: 'Nick', nameSuffix: 'Jr' });
    expect(body.businessInfo.jobTitle).toBe('CEO');
    expect(body.businessInfo.isEmployed).toBe(true);
    expect(body.businessInfo.companyCalendlyUrl).toBe('https://calendly.com/x');
    expect(body.businessInfo.companyZoomUrl).toBe('https://zoom.us/x');
    expect(body.star).toBe('Yellow');
    expect(body).not.toHaveProperty('contactId');
    expect(out).toEqual({ contactId: 5, leadId: 6, userId: null });
  });
  it('extended defaults do not create users or send welcome emails', () => {
    const props = chargekeep.actions()['addOrUpdateContact(extended)'].props;
    expect(Reflect.get(props['createUser'], 'defaultValue')).toBe(false);
    expect(Reflect.get(props['sendWelcomeEmail'], 'defaultValue')).toBe(false);
  });
  it('basic: names optional, needs one identity field, fullName fills first/last', async () => {
    await expect(run({ name: 'addOrUpdateContact', propsValue: { importType: 'Lead' } })).rejects.toThrow('at least one of');
    const spy = mockSeq({ contactId: 7, leadId: null });
    await run({ name: 'addOrUpdateContact', propsValue: { importType: 'Lead', fullName: 'Jane van Doe', contactId: 0 } });
    const body = sent({ spy }).body;
    expect(body.personalInfo.fullName).toEqual({ firstName: 'Jane', lastName: 'van Doe' });
    expect(body).not.toHaveProperty('contactId');
  });
  it('ai upsert never creates users or sends email, validates custom field keys', async () => {
    const spy = mockSeq({ contactId: 9, leadId: 10 });
    await run({ name: 'upsert_contact', propsValue: { email: 'a@example.com', customFields: { customField1: 'x' } } });
    const body = sent({ spy }).body;
    expect(body.createUser).toBe(false);
    expect(body.sendWelcomeEmail).toBe(false);
    expect(body.importType).toBe('Lead');
    expect(body.matchExisting).toBe(true);
    expect(body.personalInfo).toEqual({ email1: 'a@example.com', customFields: { customField1: 'x' } });
    await expect(run({ name: 'upsert_contact', propsValue: { email: 'a@example.com', customFields: { foo: 1 } } })).rejects.toThrow('Unknown custom field keys');
    await expect(run({ name: 'upsert_contact', propsValue: { email: 'a@example.com', contactType: 'Vendor' } })).rejects.toThrow('Contact Type');
  });
  it('ai upsert keeps matchExisting on when an agent leaves it out (optional checkboxes are filled with defaultValue ?? false)', async () => {
    const props = chargekeep.actions()['upsert_contact'].props;
    expect(Reflect.get(props['matchExisting'], 'defaultValue')).toBe(true);
    const propsValue: Record<string, unknown> = { email: 'jane@example.com', mobilePhone: '+15550100' };
    for (const [key, prop] of Object.entries(props)) {
      if (prop.type === PropertyType.CHECKBOX && !prop.required && !(key in propsValue)) propsValue[key] = Reflect.get(prop, 'defaultValue') ?? false;
    }
    const spy = mockSeq({ contactId: 9, leadId: 10 });
    await run({ name: 'upsert_contact', propsValue });
    expect(sent({ spy }).body.matchExisting).toBe(true);
  });
  it('get contact: needs an identifier, sends only set ones, maps output', async () => {
    await expect(run({ name: 'getContactDetails', propsValue: {} })).rejects.toThrow('at least one of');
    const spy = mockSeq({ id: 3, typeId: 'P', fullName: 'A B', emails: [{ id: 1, emailAddress: 'a@x.com' }], primaryEmailId: 1, person: { firstName: 'A', lastName: 'B' } });
    const out = await run({ name: 'getContactDetails', propsValue: { userEmail: ' a@x.com ', contactId: 0 } });
    expect(sent({ spy }).method).toBe(HttpMethod.GET);
    expect(sent({ spy }).queryParams).toEqual({ userEmail: 'a@x.com' });
    expect(sent({ spy }).headers).not.toHaveProperty('content-type');
    expect(out).toMatchObject({ id: 3, firstName: 'A', lastName: 'B', primaryEmail: 'a@x.com' });
  });
});

describe('invoices', () => {
  const human = { contactId: 4, status: 'Draft', invoiceNo: 'INV - 20240610 - 746C', dueDate: '2026-11-30T00:00:00Z', currencyId: 'INR', invoiceDescription: 'd', quantity: 2, rate: 5, historicalData: false };
  it('invoice number is a string, totals and dates default in run, no $0 transaction', async () => {
    const spy = mockSeq(11, { id: 11, number: 'INV - 20240610 - 746C', status: 'Draft', lines: [] });
    const out = await run({ name: 'createInvoice', propsValue: human });
    const body = sent({ spy }).body;
    expect(body.number).toBe('INV - 20240610 - 746C');
    expect(body.currencyId).toBe('INR');
    expect(body.grandTotal).toBe(10);
    expect(body.lines).toEqual([{ quantity: 2, rate: 5, total: 10, unitId: 'Unit', sortOrder: 0 }]);
    expect(body).not.toHaveProperty('transactions');
    expect(body).not.toHaveProperty('historicalData');
    expect(Date.now() - new Date(body.date).getTime()).toBeLessThan(10_000);
    expect(sent({ spy, index: 1 }).queryParams).toEqual({ id: '11' });
    expect(out).toMatchObject({ invoiceId: 11, number: 'INV - 20240610 - 746C', detailsError: null });
  });
  it('sends a transaction only when an amount is given', async () => {
    const spy = mockSeq(12, { id: 12 });
    await run({ name: 'createInvoice', propsValue: { ...human, amount: 10, transactionDate: '2026-10-01T00:00:00Z', historicalData: true } });
    expect(sent({ spy }).body.transactions).toEqual([{ date: '2026-10-01T00:00:00.000Z', amount: 10 }]);
    expect(sent({ spy }).body.historicalData).toBe(true);
  });
  it('requires a contact', async () => {
    await expect(run({ name: 'createInvoice', propsValue: { ...human, contactId: 0 } })).rejects.toThrow('Contact ID or an External Contact ID');
  });
  it('still returns the invoice ID when reading it back fails', async () => {
    mockSeq(13, abpFailure({ status: 500, message: 'boom' }));
    const out = await run({ name: 'createInvoice', propsValue: human });
    expect(out).toMatchObject({ invoiceId: 13, detailsError: expect.stringContaining('boom') });
  });
  it('ai invoice takes a lines array', async () => {
    const spy = mockSeq(14, { id: 14 });
    await run({ name: 'create_invoice', propsValue: { contactXref: 'x1', invoiceNumber: 'A-1', dueDate: '2026-11-30', description: 'd', lines: [{ productCode: 'P1', quantity: 1, rate: 6 }, { description: 'c', quantity: 3, rate: 2 }] } });
    const body = sent({ spy }).body;
    expect(body.contactXref).toBe('x1');
    expect(body.status).toBe('Draft');
    expect(body.grandTotal).toBe(12);
    expect(body.lines[1]).toEqual({ quantity: 3, rate: 2, total: 6, unitId: 'Unit', description: 'c', sortOrder: 1 });
    await expect(run({ name: 'create_invoice', propsValue: { contactId: '1', invoiceNumber: 'A', dueDate: '2026-11-30', description: 'd', lines: {} } })).rejects.toThrow('JSON array');
  });
});

describe('products', () => {
  it('general product sends a OneTime price option', async () => {
    const spy = mockSeq(20, { id: 20, code: 'S', priceOptions: [{ id: 1, type: 'OneTime', fee: 5 }] });
    const out = await run({ name: 'createProduct', propsValue: { productType: 'General', name: 'N', code: 'S', price: 5, unit: 'Piece', currencyId: 'USD' } });
    expect(sent({ spy }).body).toEqual({ code: 'S', name: 'N', type: 'General', currencyId: 'USD', priceOptions: [{ type: 'OneTime', unit: 'Piece', fee: 5 }] });
    expect(out).toMatchObject({ productId: 20, priceOptions: [{ id: 1, type: 'OneTime', fee: 5 }] });
  });
  it('subscription product sends a Subscription price option', async () => {
    const spy = mockSeq(21, { id: 21 });
    await run({ name: 'createProduct', propsValue: { productType: 'Subscription', name: 'N', code: 'S', fee: 4, frequency: 'Annual', signupFee: 1, trialDayCount: 7 } });
    expect(sent({ spy }).body.priceOptions).toEqual([{ type: 'Subscription', frequency: 'Annual', fee: 4, signupFee: 1, trialDayCount: 7 }]);
  });
  it('requires a price', async () => {
    await expect(run({ name: 'createProduct', propsValue: { productType: 'General', name: 'N', code: 'S' } })).rejects.toThrow('Price is required');
  });
});

describe('subscriptions', () => {
  it('sends products[] only and returns the resulting subscription', async () => {
    const spy = mockSeq(null, [
      { id: 1, productCode: 'SUB', status: 'Cancelled' },
      { id: 2, productCode: 'sub', status: 'Current', paymentPeriodType: 'Monthly' },
      { id: 3, productCode: 'OTHER' },
    ]);
    const out = await run({ name: 'addOrUpdateSubscription', propsValue: { contactId: 5, productCode: 'SUB', paymentPeriodType: 'Monthly', hasRecurringBilling: false } });
    expect(sent({ spy }).method).toBe(HttpMethod.PUT);
    expect(sent({ spy }).body).toEqual({ contactId: 5, products: [{ productCode: 'SUB', paymentPeriodType: 'Monthly', hasRecurringBilling: false }] });
    expect(out).toMatchObject({ contactId: 5, subscription: { subscriptionId: 2, status: 'Current' }, detailsError: null });
  });
  it('resolves the contact from the XREF and requires a contact', async () => {
    const spy = mockSeq(null, { id: 8 }, []);
    const out = await run({ name: 'addOrUpdateSubscription', propsValue: { contactXref: 'x', productCode: 'SUB', paymentPeriodType: 'Monthly' } });
    expect(sent({ spy, index: 1 }).queryParams).toEqual({ xref: 'x' });
    expect(out).toMatchObject({ contactId: 8, subscription: null });
    await expect(run({ name: 'addOrUpdateSubscription', propsValue: { contactId: 0, productCode: 'SUB', paymentPeriodType: 'Monthly' } })).rejects.toThrow('Contact ID or an External Contact ID');
  });
});

describe('search', () => {
  it('search contacts caps the limit and flags mayHaveMore', async () => {
    const spy = mockSeq([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
    const out = await run({ name: 'search_contacts', propsValue: { phrase: 'a', limit: 2 } });
    expect(sent({ spy }).queryParams).toEqual({ SearchPhrase: 'a', TopCount: '2' });
    expect(out).toMatchObject({ count: 2, mayHaveMore: true });
    vi.restoreAllMocks();
    const second = mockSeq([]);
    await run({ name: 'search_contacts', propsValue: { phrase: 'a', limit: 1000 } });
    expect(sent({ spy: second }).queryParams.TopCount).toBe('100');
  });
});

describe('webhook triggers', () => {
  const ctx = (store: ReturnType<typeof memoryStore>) => ({ auth, webhookUrl: 'https://ap.example/hook', store });
  it('onEnable subscribes and stores the id; checks ABP success', async () => {
    const store = memoryStore();
    const spy = mockSeq({ id: 55 });
    await Reflect.apply(newLead.onEnable, undefined, [ctx(store)]);
    expect(sent({ spy }).body).toEqual({ eventName: 'LeadCreated', targetUrl: 'https://ap.example/hook' });
    expect(store.data.get('_new_lead_trigger')).toEqual({ webhookId: 55 });
    mockSeq(abpFailure({ status: 400, message: 'You do not have required permission' }));
    await expect(Reflect.apply(newLead.onEnable, undefined, [ctx(memoryStore())])).rejects.toThrow('required permission');
  });
  it('onEnable unsubscribes when store.put fails', async () => {
    const store = memoryStore();
    store.put.mockRejectedValueOnce(new Error('store down'));
    const spy = mockSeq({ id: 56 }, null);
    await expect(Reflect.apply(newLead.onEnable, undefined, [ctx(store)])).rejects.toThrow('store down');
    expect(sent({ spy, index: 1 }).url).toBe('https://crm.chargekeep.com/api/services/Platform/Event/Unsubscribe');
    expect(sent({ spy, index: 1 }).queryParams).toEqual({ id: '56' });
  });
  it('onDisable keeps state when unsubscribe fails, clears it on success or already-gone', async () => {
    const store = memoryStore();
    store.data.set('_new_lead_trigger', { webhookId: 57 });
    mockSeq(abpFailure({ status: 500, message: 'boom' }));
    await expect(Reflect.apply(newLead.onDisable, undefined, [ctx(store)])).rejects.toThrow('boom');
    expect(store.data.get('_new_lead_trigger')).toEqual({ webhookId: 57 });
    mockSeq(abpFailure({ status: 400, message: 'Event Subscription does not exist or is not accessible' }));
    await Reflect.apply(newLead.onDisable, undefined, [ctx(store)]);
    expect(store.data.has('_new_lead_trigger')).toBe(false);
  });
  it('emits one item per event in an array body and dedupes within and across deliveries', async () => {
    const store = memoryStore();
    const a = { eventType: 'Subscription.CreatedOrUpdated', id: 146911, statusId: 'U', eventTime: '2026-10-21T15:37:58' };
    const b = { eventType: 'Subscription.CreatedOrUpdated', id: 146912, statusId: 'A', eventTime: '2026-10-21T15:37:58' };
    expect(await Reflect.apply(newLead.run, undefined, [{ store, payload: { body: [a, b, a] } }])).toEqual([
      { ...a, [DEDUPE_KEY_PROPERTY]: 'chargekeep:LeadCreated:146911:2026-10-21T15:37:58' },
      { ...b, [DEDUPE_KEY_PROPERTY]: 'chargekeep:LeadCreated:146912:2026-10-21T15:37:58' },
    ]);
    expect(await Reflect.apply(newLead.run, undefined, [{ store, payload: { body: [a, b] } }])).toEqual([]);
  });
  it('new subscription keeps two status changes of one subscription in the same second', async () => {
    const store = memoryStore();
    const u = { eventType: 'Subscription.CreatedOrUpdated', id: 146911, statusId: 'A', eventTime: '2026-10-21T15:37:58' };
    const c = { ...u, statusId: 'C' };
    const out = await Reflect.apply(newSubscription.run, undefined, [{ store, payload: { body: [u, c, u] } }]);
    expect(out.map((e: Record<string, unknown>) => e[DEDUPE_KEY_PROPERTY])).toEqual([
      'chargekeep:Subscription.CreatedOrUpdated:146911:2026-10-21T15:37:58:A',
      'chargekeep:Subscription.CreatedOrUpdated:146911:2026-10-21T15:37:58:C',
    ]);
  });
  it('keeps per-event markers so overlapping deliveries never overwrite each other, and bounds them', async () => {
    const store = memoryStore();
    await Reflect.apply(newLead.run, undefined, [{ store, payload: { body: [{ id: 1, eventTime: 't' }] } }]);
    await Reflect.apply(newLead.run, undefined, [{ store, payload: { body: [{ id: 2, eventTime: 't' }] } }]);
    expect(store.data.get('_new_lead_trigger_seen:1:t')).toBe(true);
    expect(store.data.get('_new_lead_trigger_seen:2:t')).toBe(true);
    const many = Array.from({ length: 501 }, (_, i) => ({ id: 1000 + i, eventTime: 't' }));
    await Reflect.apply(newLead.run, undefined, [{ store, payload: { body: many } }]);
    const index = store.data.get('_new_lead_trigger_seen');
    expect(Array.isArray(index) && index.length).toBe(500);
    expect(store.data.has('_new_lead_trigger_seen:1:t')).toBe(false);
    expect(store.data.has('_new_lead_trigger_seen:1500:t')).toBe(true);
  });
  it('extended contact accepts an identity given only as work email 2 or 3', async () => {
    mockSeq({ contactId: 1, leadId: null });
    await expect(run({ name: 'addOrUpdateContact(extended)', propsValue: { importType: 'Lead', workEmail3: 'w3@example.com' } })).resolves.toMatchObject({ contactId: 1 });
  });
  it('drops retried deliveries', async () => {
    const store = memoryStore();
    const payload = { body: { transaction: { id: 403 }, eventType: 'Payment.Created' } };
    expect(await Reflect.apply(newPayment.run, undefined, [{ store, payload }])).toHaveLength(1);
    expect(await Reflect.apply(newPayment.run, undefined, [{ store, payload }])).toHaveLength(0);
    const lead = { body: { id: 1, eventTime: '2022-06-30T13:32:54Z' } };
    expect(await Reflect.apply(newLead.run, undefined, [{ store, payload: lead }])).toHaveLength(1);
    expect(await Reflect.apply(newLead.run, undefined, [{ store, payload: lead }])).toHaveLength(0);
    expect(await Reflect.apply(newLead.run, undefined, [{ store, payload: { body: 'x' } }])).toHaveLength(0);
  });
});
