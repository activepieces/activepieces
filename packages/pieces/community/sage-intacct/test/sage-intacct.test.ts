import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, InputPropertyMap, StaticPropsValue } from '@activepieces/pieces-framework';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { sageIntacct } from '../src';
import { sageIntacctClient } from '../src/lib/common/client';
import { sageIntacctPoll } from '../src/lib/common/poll';
import { sageIntacctBodies } from '../src/lib/common/props';
import { sageIntacctSchemas } from '../src/lib/common/output-schemas';
import { createContactAction } from '../src/lib/actions/create-contact';
import { createCustomerAction } from '../src/lib/actions/create-customer';
import { createVendorAction } from '../src/lib/actions/create-vendor';
import { findCustomerAction } from '../src/lib/actions/find-customer';
import { findVendorAction } from '../src/lib/actions/find-vendor';
import { listEntitiesAction } from '../src/lib/actions/list-entities';
import { listGlAccountsAction } from '../src/lib/actions/list-gl-accounts';
import { createBillAction } from '../src/lib/actions/create-bill';
import { createBillAiAction } from '../src/lib/actions/create-bill-ai';
import { createInvoiceAction } from '../src/lib/actions/create-invoice';
import { createInvoiceAiAction } from '../src/lib/actions/create-invoice-ai';
import { findBillAction } from '../src/lib/actions/find-bill';
import { findInvoiceAction } from '../src/lib/actions/find-invoice';
import { findInvoicesByDateAction } from '../src/lib/actions/find-invoices-by-date';
import { listDepartmentsAction } from '../src/lib/actions/list-departments';
import { listLocationsAction } from '../src/lib/actions/list-locations';
import { listTransactionDefinitionsAction } from '../src/lib/actions/list-transaction-definitions';
import { updateBillAction } from '../src/lib/actions/update-bill';
import { updateCustomerAction } from '../src/lib/actions/update-customer';
import { updateInvoiceAction } from '../src/lib/actions/update-invoice';
import { newArInvoiceTrigger } from '../src/lib/triggers/new-ar-invoice';
import { newContactTrigger } from '../src/lib/triggers/new-contact';
import { newVendorTrigger } from '../src/lib/triggers/new-vendor';
import { newCustomerTrigger } from '../src/lib/triggers/new-customer';
import { newPaymentReceivedTrigger } from '../src/lib/triggers/new-payment-received';

const BASE = 'https://api.intacct.com/ia/api/v1';
const auth = {
  type: AppConnectionType.OAUTH2,
  access_token: 'tok-123',
  client_id: 'cid',
  data: {},
  token_type: 'Bearer',
  expires_in: 43200,
  claimed_at: 0,
  scope: '',
  token_url: `${BASE}/oauth2/token`,
};

afterEach(() => {
  vi.restoreAllMocks();
});

function actionContext<Props extends InputPropertyMap>({ propsValue }: { propsValue: StaticPropsValue<Props> }) {
  return { ...createMockActionContext<Props>({ propsValue }), auth };
}

function mockResponses({ bodies }: { bodies: unknown[] }) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) {
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
  return spy;
}

function requestAt({ spy, index }: { spy: ReturnType<typeof mockResponses>; index: number }): HttpRequest {
  return spy.mock.calls[index][0];
}

function memoryStore({ initial }: { initial: Record<string, unknown> }) {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    store: {
      put: async <T>(key: string, value: T) => {
        data[key] = value;
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const value = data[key];
        return value === undefined ? null : JSON.parse(JSON.stringify(value));
      },
      delete: async (key: string) => {
        delete data[key];
      },
    },
  };
}

const customerRecord = {
  key: '45',
  id: 'CUST-0045',
  name: 'Acme',
  status: 'active',
  contacts: { default: { email1: 'a@example.com', printAs: 'Acme', mailingAddress: { city: 'Austin' } } },
  totalDue: '12.50',
  audit: { createdDateTime: '2026-11-18T09:30:00Z', modifiedDateTime: '2026-11-18T09:31:00Z' },
};

describe('piece', () => {
  it('registers phase 1 and 2 actions and triggers', () => {
    expect(Object.keys(sageIntacct.actions()).sort()).toEqual(
      [
        'create_bill',
        'create_bill_ai',
        'create_contact',
        'create_customer',
        'create_invoice',
        'create_invoice_ai',
        'create_vendor',
        'custom_api_call',
        'find_bill',
        'find_customer',
        'find_invoice',
        'find_invoices_by_date',
        'find_vendor',
        'list_entities',
        'list_departments',
        'list_gl_accounts',
        'list_locations',
        'list_transaction_definitions',
        'update_bill',
        'update_customer',
        'update_invoice',
      ].sort(),
    );
    expect(Object.keys(sageIntacct.triggers()).sort()).toEqual(['new_ar_invoice', 'new_contact', 'new_customer', 'new_payment_received', 'new_vendor']);
  });
});

describe('client', () => {
  it('maps an ia::error response to a readable message with responseBody', async () => {
    const body = { 'ia::result': { 'ia::error': { code: 'invalidRequest', message: 'Bad request', details: [{ message: 'name is required' }] } } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError('[redacted]', { status: 400, responseBody: body }));
    const error = await sageIntacctClient
      .request({ auth, method: HttpMethod.POST, path: '/objects/x', body: {}, operation: 'create x' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toContain('Sage Intacct create x failed (HTTP 400): Bad request name is required [invalidRequest]');
    expect(error).toMatchObject({ responseBody: body, httpStatus: 400 });
    expect(error).not.toHaveProperty('status');
    expect(error).not.toHaveProperty('body');
  });

  it('maps transport errors and warns that a write may have applied', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(
      sageIntacctClient.request({ auth, method: HttpMethod.POST, path: '/objects/x', operation: 'create x' }),
    ).rejects.toThrow('Sage Intacct create x could not reach the API: socket hang up. The change may still have been applied');
  });

  it('pages the query service until next is null and stops at the limit', async () => {
    const spy = mockResponses({
      bodies: [
        { 'ia::result': [{ key: '1' }, { key: '2' }], 'ia::meta': { totalCount: 3, start: 1, pageSize: 2, next: 3 } },
        { 'ia::result': [{ key: '3' }], 'ia::meta': { totalCount: 3, start: 3, pageSize: 2, next: null } },
      ],
    });
    const result = await sageIntacctClient.queryAll({ auth, object: 'a/b', fields: ['key'], limit: 10 });
    expect(result).toEqual({ records: [{ key: '1' }, { key: '2' }, { key: '3' }], truncated: false });
    expect(requestAt({ spy, index: 1 }).body).toMatchObject({ object: 'a/b', start: 3 });
    const request = requestAt({ spy, index: 0 });
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe(`${BASE}/services/core/query`);
    expect(request.headers).toMatchObject({ Authorization: 'Bearer tok-123', Accept: 'application/json' });
    expect(request.redactBodyInErrors).toBe(true);
  });

  it('reports truncation at the limit', async () => {
    mockResponses({ bodies: [{ 'ia::result': [{ key: '1' }, { key: '2' }], 'ia::meta': { next: 3 } }] });
    const result = await sageIntacctClient.queryAll({ auth, object: 'a/b', fields: ['key'], limit: 2 });
    expect(result.truncated).toBe(true);
  });
});

describe('actions', () => {
  it('create_customer POSTs the body then reads the record back', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '45', id: 'CUST-0045' } }, { 'ia::result': customerRecord }] });
    const result = await createCustomerAction.run(
      actionContext({
        propsValue: {
          customer_id: 'CUST-0045',
          name: 'Acme',
          status: 'active',
          print_as: undefined,
          company_name: undefined,
          first_name: undefined,
          last_name: undefined,
          email: ' a@example.com ',
          phone: undefined,
          address_line_1: undefined,
          address_line_2: undefined,
          city: 'Austin',
          state: undefined,
          postal_code: undefined,
          country: undefined,
        },
      }),
    );
    const create = requestAt({ spy, index: 0 });
    expect(create.method).toBe(HttpMethod.POST);
    expect(create.url).toBe(`${BASE}/objects/accounts-receivable/customer`);
    expect(create.body).toEqual({
      id: 'CUST-0045',
      name: 'Acme',
      status: 'active',
      contacts: { default: { printAs: 'Acme', email1: 'a@example.com', mailingAddress: { city: 'Austin' } } },
    });
    const read = requestAt({ spy, index: 1 });
    expect(read.method).toBe(HttpMethod.GET);
    expect(read.url).toBe(`${BASE}/objects/accounts-receivable/customer/45`);
    expect(result).toMatchObject({ key: '45', id: 'CUST-0045', email: 'a@example.com', city: 'Austin', total_due: 12.5 });
  });

  it('create_customer succeeds with partial output when the read-back fails', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { 'ia::result': { key: '45', id: 'CUST-0045' } } });
    spy.mockRejectedValueOnce(new HttpError('x', { status: 500, responseBody: {} }));
    const result = await createCustomerAction.run(
      actionContext({
        propsValue: {
          customer_id: 'CUST-0045',
          name: 'Acme',
          status: undefined,
          print_as: undefined,
          company_name: undefined,
          first_name: undefined,
          last_name: undefined,
          email: undefined,
          phone: undefined,
          address_line_1: undefined,
          address_line_2: undefined,
          city: undefined,
          state: undefined,
          postal_code: undefined,
          country: undefined,
        },
      }),
    );
    expect(result).toMatchObject({ key: '45', id: 'CUST-0045', read_back_incomplete: true });
  });

  it('create_vendor POSTs to the vendor object', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '87' } }, { 'ia::result': { key: '87', id: 'V1', name: 'North' } }] });
    await createVendorAction.run(
      actionContext({
        propsValue: {
          vendor_id: undefined,
          name: 'North',
          status: undefined,
          print_as: 'North Inc',
          company_name: undefined,
          first_name: undefined,
          last_name: undefined,
          email: undefined,
          phone: undefined,
          address_line_1: undefined,
          address_line_2: undefined,
          city: undefined,
          state: undefined,
          postal_code: undefined,
          country: undefined,
        },
      }),
    );
    const create = requestAt({ spy, index: 0 });
    expect(create.url).toBe(`${BASE}/objects/accounts-payable/vendor`);
    expect(create.body).toEqual({ name: 'North', contacts: { default: { printAs: 'North Inc' } } });
    expect(requestAt({ spy, index: 1 }).url).toBe(`${BASE}/objects/accounts-payable/vendor/87`);
  });

  it('update_customer PATCHes only the filled fields', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '45' } }, { 'ia::result': customerRecord }] });
    await updateCustomerAction.run(
      actionContext({
        propsValue: {
          customer_key: '45',
          name: undefined,
          status: 'inactive',
          print_as: undefined,
          company_name: undefined,
          first_name: undefined,
          last_name: undefined,
          email: 'b@example.com',
          phone: '',
          address_line_1: undefined,
          address_line_2: undefined,
          city: undefined,
          state: undefined,
          postal_code: undefined,
          country: undefined,
        },
      }),
    );
    const patch = requestAt({ spy, index: 0 });
    expect(patch.method).toBe(HttpMethod.PATCH);
    expect(patch.url).toBe(`${BASE}/objects/accounts-receivable/customer/45`);
    expect(patch.body).toEqual({ status: 'inactive', contacts: { default: { email1: 'b@example.com' } } });
  });

  it('update_customer rejects an empty update without calling the API', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      updateCustomerAction.run(
        actionContext({
          propsValue: {
            customer_key: '45',
            name: ' ',
            status: undefined,
            print_as: undefined,
            company_name: undefined,
            first_name: undefined,
            last_name: undefined,
            email: undefined,
            phone: undefined,
            address_line_1: undefined,
            address_line_2: undefined,
            city: undefined,
            state: undefined,
            postal_code: undefined,
            country: undefined,
          },
        }),
      ),
    ).rejects.toThrow('Fill at least one field to update.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('create_contact POSTs a flat contact with a derived printAs', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '312' } }, { 'ia::result': { key: '312', id: 'Doe, Jane', printAs: 'Jane Doe' } }] });
    const result = await createContactAction.run(
      actionContext({
        propsValue: {
          contact_name: 'Doe, Jane',
          print_as: undefined,
          company_name: undefined,
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          phone: undefined,
          address_line_1: '1 Main',
          address_line_2: undefined,
          city: undefined,
          state: undefined,
          postal_code: undefined,
          country: undefined,
          mobile: '555',
        },
      }),
    );
    const create = requestAt({ spy, index: 0 });
    expect(create.method).toBe(HttpMethod.POST);
    expect(create.url).toBe(`${BASE}/objects/company-config/contact`);
    expect(create.body).toEqual({
      id: 'Doe, Jane',
      printAs: 'Jane Doe',
      firstName: 'Jane',
      lastName: 'Doe',
      email1: 'jane@example.com',
      mailingAddress: { addressLine1: '1 Main' },
      mobile: '555',
    });
    expect(result).toMatchObject({ key: '312', print_as: 'Jane Doe' });
  });

  it('find_customer queries by email', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [customerRecord], 'ia::meta': { next: null } }] });
    const result = await findCustomerAction.run(actionContext({ propsValue: { search_by: 'email', search_value: 'a@example.com' } }));
    const request = requestAt({ spy, index: 0 });
    expect(request.url).toBe(`${BASE}/services/core/query`);
    expect(request.body).toMatchObject({
      object: 'accounts-receivable/customer',
      filters: [{ $eq: { 'contacts.default.email1': 'a@example.com' } }],
      start: 1,
      size: 100,
    });
    expect(result).toMatchObject({ found: true, count: 1, records: [{ key: '45', email: 'a@example.com' }] });
  });

  it('find_vendor queries by name with $contains and reports not found', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    const result = await findVendorAction.run(actionContext({ propsValue: { search_by: 'name', search_value: 'North' } }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'accounts-payable/vendor', filters: [{ $contains: { name: 'North' } }] });
    expect(result).toEqual({ found: false, count: 0, truncated: false, records: [] });
  });

  it('list_entities queries company-config/entity', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [{ key: '1', id: 'E1', name: 'East', status: 'active' }], 'ia::meta': { next: null } }] });
    const result = await listEntitiesAction.run(actionContext({ propsValue: {} }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'company-config/entity', fields: ['key', 'id', 'name', 'status'] });
    expect(result).toEqual({ count: 1, truncated: false, items: [{ key: '1', id: 'E1', name: 'East', status: 'active' }] });
  });

  it('list_gl_accounts queries general-ledger/account', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [{ key: '9', id: '4000', name: 'Sales', accountType: 'incomeStatement' }], 'ia::meta': { next: null } }] });
    const result = await listGlAccountsAction.run(actionContext({ propsValue: {} }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'general-ledger/account' });
    expect(result.items[0]).toMatchObject({ id: '4000', account_type: 'incomeStatement' });
  });

  it('list_transaction_definitions queries the chosen module', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [{ key: '3', id: 'Sales Invoice' }], 'ia::meta': { next: null } }] });
    await listTransactionDefinitionsAction.run(actionContext({ propsValue: { module: 'order-entry' } }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'order-entry/txn-definition' });
  });
});

describe('review round 2 regressions', () => {
  it('create_bill_ai accepts numeric ids in JSON-string lines and queries list objects', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '1600' } }, { 'ia::result': { key: '1600' } }] });
    await createBillAiAction.run(
      actionContext({
        propsValue: {
          vendor_id: 'APTEST-V1',
          bill_date: '2026-11-24',
          due_date: '2026-12-24',
          bill_number: undefined,
          reference_number: undefined,
          description: undefined,
          lines: JSON.stringify([{ gl_account_id: 6000, amount: 25, location_id: 100, department_id: 200 }]),
        },
      }),
    );
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      vendor: { id: 'APTEST-V1' },
      lines: [{ glAccount: { id: '6000' }, txnAmount: '25.00', dimensions: { vendor: { id: 'APTEST-V1' }, location: { id: '100' }, department: { id: '200' } } }],
    });
  });

  it('list_departments and list_locations query their objects', async () => {
    let spy = mockResponses({ bodies: [{ 'ia::result': [{ key: '1', id: '100', name: 'Counselling' }], 'ia::meta': { next: null } }] });
    await listDepartmentsAction.run(actionContext({ propsValue: {} }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'company-config/department' });
    vi.restoreAllMocks();
    spy = mockResponses({ bodies: [{ 'ia::result': [{ key: '14', id: '100', name: 'General' }], 'ia::meta': { next: null } }] });
    const result = await listLocationsAction.run(actionContext({ propsValue: {} }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'company-config/location' });
    expect(result).toMatchObject({ count: 1, items: [{ id: '100', name: 'General' }] });
  });

  it('new_vendor test() asks for the 5 newest vendors and maps them', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [{ key: '64', id: 'V-1', name: 'Design Works' }], 'ia::meta': { next: null } }] });
    const base = createMockPollingTriggerContext<typeof newVendorTrigger.props>({ propsValue: {} });
    const result = await newVendorTrigger.test({ ...base, auth });
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'accounts-payable/vendor', size: 5 });
    expect(result[0]).toMatchObject({ key: '64', id: 'V-1', name: 'Design Works' });
  });

  it('enable keeps existing state on a republish and re-baselines on a plain enable', async () => {
    const initial = { marker: '2026-11-20T10:00:00Z', seenKeys: ['7'] };
    const { store, data } = memoryStore({ initial: { k: initial } });
    const idle = vi.spyOn(httpClient, 'sendRequest');
    await sageIntacctPoll.enable({ auth, store, storeKey: 'k', object: 'o', isRepublish: true });
    expect(idle).not.toHaveBeenCalled();
    expect(data['k']).toEqual(initial);
    vi.restoreAllMocks();
    mockResponses({ bodies: [{ 'ia::result': [{ key: '9', audit: { createdDateTime: '2026-11-24T10:00:00Z' } }], 'ia::meta': { next: null } }] });
    await sageIntacctPoll.enable({ auth, store, storeKey: 'k', object: 'o' });
    expect(data['k']).toEqual({ marker: '2026-11-24T10:00:00Z', seenKeys: ['9'] });
  });

  it('enableByKey keeps existing state on a republish and re-baselines on a plain enable', async () => {
    const { store, data } = memoryStore({ initial: { k: { lastKey: 100 } } });
    const idle = vi.spyOn(httpClient, 'sendRequest');
    await sageIntacctPoll.enableByKey({ auth, store, storeKey: 'k', object: 'o', isRepublish: true });
    expect(idle).not.toHaveBeenCalled();
    expect(data['k']).toEqual({ lastKey: 100 });
    vi.restoreAllMocks();
    mockResponses({ bodies: [{ 'ia::result': [{ key: '294' }], 'ia::meta': { next: null } }] });
    await sageIntacctPoll.enableByKey({ auth, store, storeKey: 'k', object: 'o' });
    expect(data['k']).toEqual({ lastKey: 294 });
  });

  it('dropdown search queries only text fields for invoices and bills', () => {
    const invoice = sageIntacctBodies.buildDropdownQuery({ labelPaths: ['invoiceNumber', 'customer.name'], searchPaths: ['invoiceNumber', 'customer.name'], searchValue: 'AR_Inv-00001' });
    expect(invoice.filters).toEqual([{ $contains: { invoiceNumber: 'AR_Inv-00001' } }, { $contains: { 'customer.name': 'AR_Inv-00001' } }]);
    expect(invoice.filterExpression).toBe('1 or 2');
    expect(JSON.stringify(invoice.filters)).not.toContain('"id"');
    const customer = sageIntacctBodies.buildDropdownQuery({ labelPaths: ['name'], searchValue: 'Acme' });
    expect(customer.filters).toEqual([{ $contains: { name: 'Acme' } }, { $contains: { id: 'Acme' } }]);
    const empty = sageIntacctBodies.buildDropdownQuery({ labelPaths: ['name'] });
    expect(empty.filters).toBeUndefined();
    expect(empty.filterExpression).toBeUndefined();
  });

  it('a pre-0.93 republish (onDisable then onEnable) loses no waiting records', async () => {
    const rec = ({ key, at }: { key: string; at: string }) => ({ key, audit: { createdDateTime: at } });
    const { store, data } = memoryStore({ initial: {} });
    const base = createMockPollingTriggerContext<typeof newCustomerTrigger.props>({ propsValue: {} });
    const ctx = { ...base, auth, store };
    let spy = mockResponses({ bodies: [{ 'ia::result': [rec({ key: '1', at: '2026-11-20T09:00:00Z' })], 'ia::meta': { next: null } }] });
    await newCustomerTrigger.onEnable(ctx);
    expect(data['sage_intacct_new_customer_state']).toEqual({ marker: '2026-11-20T09:00:00Z', seenKeys: ['1'] });
    vi.restoreAllMocks();
    spy = mockResponses({ bodies: [{ 'ia::result': [rec({ key: '2', at: '2026-11-20T10:00:00Z' })], 'ia::meta': { next: null } }] });
    const firstPoll = await newCustomerTrigger.run(ctx);
    expect(firstPoll.map((r) => r['key'])).toEqual(['2']);
    vi.restoreAllMocks();
    spy = vi.spyOn(httpClient, 'sendRequest');
    await newCustomerTrigger.onDisable(ctx);
    await newCustomerTrigger.onEnable({ ...ctx, isRepublish: true });
    expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    mockResponses({ bodies: [{ 'ia::result': [rec({ key: '2', at: '2026-11-20T10:00:00Z' }), rec({ key: '3', at: '2026-11-20T10:30:00Z' })], 'ia::meta': { next: null } }] });
    const afterRepublish = await newCustomerTrigger.run(ctx);
    expect(afterRepublish.map((r) => r['key'])).toEqual(['3']);
  });

  it('enable pages through records tied at the newest timestamp', async () => {
    const tie = (key: string) => ({ key, audit: { createdDateTime: '2026-11-24T10:00:00Z' } });
    const { store, data } = memoryStore({ initial: {} });
    mockResponses({
      bodies: [
        { 'ia::result': [tie('3'), tie('2')], 'ia::meta': { next: 3 } },
        { 'ia::result': [tie('1'), { key: '0', audit: { createdDateTime: '2026-11-24T09:00:00Z' } }], 'ia::meta': { next: null } },
      ],
    });
    await sageIntacctPoll.enable({ auth, store, storeKey: 'k', object: 'o' });
    expect(data['k']).toEqual({ marker: '2026-11-24T10:00:00Z', seenKeys: ['3', '2', '1'] });
  });

  it('parseIsoDate rejects rolled-over dates and parseLineItems rejects amounts that round to zero', () => {
    expect(() => sageIntacctBodies.parseIsoDate({ value: '2026-02-30', label: 'Due Date' })).toThrow('valid date');
    expect(() => sageIntacctBodies.parseLineItems({ value: [{ gl_account_id: '4000', amount: 0.004 }], label: 'lines' })).toThrow('not zero after rounding');
  });

  it('invoice and bill search schemas label records by their number', () => {
    const invoiceRecords = sageIntacctSchemas.invoiceSearch.fields.find((field) => field.key === 'records');
    const billRecords = sageIntacctSchemas.billSearch.fields.find((field) => field.key === 'records');
    expect(invoiceRecords).toMatchObject({ labelKey: 'invoice_number' });
    expect(billRecords).toMatchObject({ labelKey: 'bill_number' });
  });

  it('a failed network query does not warn that a change may have been applied', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('ECONNRESET'));
    const error = await sageIntacctClient
      .queryPage({ auth, object: 'o', fields: ['key'], start: 1, size: 5 })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).not.toContain('may still have been applied');
  });

  it('custom_api_call refuses absolute URLs outside the Sage Intacct API host', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const customApiCall = sageIntacct.actions()['custom_api_call'];
    await expect(
      customApiCall.run(
        actionContext({
          propsValue: { url: { url: 'https://api.intacct.com.evil.io/steal' }, method: HttpMethod.GET, headers: {}, queryParams: {}, failsafe: false },
        }),
      ),
    ).rejects.toThrow('only accepts paths relative');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('pollNewRecords', () => {
  const KEY = 'k';
  const rec = ({ key, at }: { key: string; at: string }) => ({ key, audit: { createdDateTime: at } });

  it('initialises the marker from the newest server timestamp on first run and emits nothing', async () => {
    const { store, data } = memoryStore({ initial: {} });
    const spy = mockResponses({
      bodies: [
        {
          'ia::result': [rec({ key: '9', at: '2026-11-24T10:00:00Z' }), rec({ key: '8', at: '2026-11-24T10:00:00Z' }), rec({ key: '7', at: '2026-11-24T09:00:00Z' })],
          'ia::meta': { next: null },
        },
      ],
    });
    expect(await sageIntacctPoll.pollNewRecords({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).toEqual([]);
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ orderBy: [{ 'audit.createdDateTime': 'desc' }, { key: 'desc' }] });
    expect(data[KEY]).toEqual({ marker: '2026-11-24T10:00:00Z', seenKeys: ['9', '8'] });
  });

  it('initialises the marker to the epoch when the object has no records', async () => {
    const { store, data } = memoryStore({ initial: {} });
    mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    expect(await sageIntacctPoll.pollNewRecords({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).toEqual([]);
    expect(data[KEY]).toEqual({ marker: '1970-01-01T00:00:00Z', seenKeys: [] });
  });

  it('dedupes ties at the marker and keeps every key at the newest timestamp', async () => {
    const { store, data } = memoryStore({ initial: { [KEY]: { marker: '2026-11-18T10:00:00Z', seenKeys: ['1'] } } });
    const spy = mockResponses({
      bodies: [
        {
          'ia::result': [rec({ key: '1', at: '2026-11-18T10:00:00Z' }), rec({ key: '2', at: '2026-11-18T10:00:00Z' }), rec({ key: '3', at: '2026-11-18T10:05:00Z' })],
          'ia::meta': { next: 4 },
        },
        { 'ia::result': [rec({ key: '4', at: '2026-11-18T10:05:00Z' })], 'ia::meta': { next: null } },
      ],
    });
    const result = await sageIntacctPoll.pollNewRecords({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] });
    expect(result.map((r) => r['key'])).toEqual(['2', '3', '4']);
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      filters: [{ $gte: { 'audit.createdDateTime': '2026-11-18T10:00:00Z' } }],
      orderBy: [{ 'audit.createdDateTime': 'asc' }, { key: 'asc' }],
    });
    expect(requestAt({ spy, index: 0 }).body).not.toHaveProperty('filterExpression');
    expect(data[KEY]).toEqual({ marker: '2026-11-18T10:05:00Z', seenKeys: ['3', '4'] });
  });

  it('a 10,000-record timestamp tie cannot stall the poll: the tie cursor skips seen keys server-side', async () => {
    const tieKeys = Array.from({ length: 10_000 }, (_, index) => String(index + 1));
    const { store, data } = memoryStore({ initial: { [KEY]: { marker: '2026-11-18T10:00:00Z', seenKeys: tieKeys } } });
    const spy = mockResponses({
      bodies: [{ 'ia::result': [rec({ key: '10001', at: '2026-11-18T10:00:05Z' })], 'ia::meta': { next: null } }],
    });
    const result = await sageIntacctPoll.pollNewRecords({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] });
    expect(result.map((r) => r['key'])).toEqual(['10001']);
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      filters: [
        { $gt: { 'audit.createdDateTime': '2026-11-18T10:00:00Z' } },
        { $eq: { 'audit.createdDateTime': '2026-11-18T10:00:00Z' } },
        { $gt: { key: '10000' } },
      ],
      filterExpression: '(1 or (2 and 3))',
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(data[KEY]).toEqual({ marker: '2026-11-18T10:00:05Z', seenKeys: ['10001'] });
  });

  it('pollQuery switches to the tie cursor only at the threshold and numbers extra filters after it', () => {
    const keys = (count: number) => Array.from({ length: count }, (_, index) => String(index + 1));
    const below = sageIntacctPoll.pollQuery({ marker: '2026-11-18T10:00:00Z', seenKeys: keys(999), extraFilters: [{ $eq: { state: 'posted' } }] });
    expect(below.filterExpression).toBeUndefined();
    expect(below.filters).toEqual([{ $gte: { 'audit.createdDateTime': '2026-11-18T10:00:00Z' } }, { $eq: { state: 'posted' } }]);
    const tied = sageIntacctPoll.pollQuery({ marker: '2026-11-18T10:00:00Z', seenKeys: keys(1000), extraFilters: [{ $eq: { state: 'posted' } }] });
    expect(tied.filterExpression).toBe('(1 or (2 and 3)) and 4');
    expect(tied.filters).toEqual([
      { $gt: { 'audit.createdDateTime': '2026-11-18T10:00:00Z' } },
      { $eq: { 'audit.createdDateTime': '2026-11-18T10:00:00Z' } },
      { $gt: { key: '1000' } },
      { $eq: { state: 'posted' } },
    ]);
    const huge = sageIntacctPoll.pollQuery({ marker: '2026-11-18T10:00:00Z', seenKeys: keys(200_000) });
    expect(huge.filters[2]).toEqual({ $gt: { key: '200000' } });
  });

  it('leaves state untouched on an empty poll', async () => {
    const initial = { marker: '2026-11-18T10:00:00Z', seenKeys: ['1'] };
    const { store, data } = memoryStore({ initial: { [KEY]: initial } });
    mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    expect(await sageIntacctPoll.pollNewRecords({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).toEqual([]);
    expect(data[KEY]).toEqual(initial);
  });

  it('does not write state when a later page fails', async () => {
    const initial = { marker: '2026-11-18T10:00:00Z', seenKeys: [] };
    const { store, data } = memoryStore({ initial: { [KEY]: initial } });
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { 'ia::result': [rec({ key: '5', at: '2026-11-18T10:01:00Z' })], 'ia::meta': { next: 2 } } });
    spy.mockRejectedValueOnce(new HttpError('x', { status: 500, responseBody: {} }));
    await expect(sageIntacctPoll.pollNewRecords({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).rejects.toThrow('HTTP 500');
    expect(data[KEY]).toEqual(initial);
  });

  it('new_customer trigger maps records and test() asks for the 5 newest', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [customerRecord], 'ia::meta': { next: null } }] });
    const base = createMockPollingTriggerContext<typeof newCustomerTrigger.props>({ propsValue: {} });
    const result = await newCustomerTrigger.test({ ...base, auth });
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      object: 'accounts-receivable/customer',
      orderBy: [{ 'audit.createdDateTime': 'desc' }, { key: 'desc' }],
      size: 5,
    });
    expect(result[0]).toMatchObject({ key: '45', name: 'Acme', created_at: '2026-11-18T09:30:00Z' });
  });
});

describe('pollNewRecordsByKey', () => {
  const KEY = 'k';

  it('initialises lastKey from the newest record on first run and emits nothing', async () => {
    const { store, data } = memoryStore({ initial: {} });
    const spy = mockResponses({ bodies: [{ 'ia::result': [{ key: '294' }], 'ia::meta': { next: null } }] });
    expect(await sageIntacctPoll.pollNewRecordsByKey({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).toEqual([]);
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ orderBy: [{ key: 'desc' }], size: 1 });
    expect(data[KEY]).toEqual({ lastKey: 294 });
  });

  it('initialises lastKey to 0 when the object has no records', async () => {
    const { store, data } = memoryStore({ initial: {} });
    mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    expect(await sageIntacctPoll.pollNewRecordsByKey({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).toEqual([]);
    expect(data[KEY]).toEqual({ lastKey: 0 });
  });

  it('emits every record above lastKey across pages and advances the state', async () => {
    const { store, data } = memoryStore({ initial: { [KEY]: { lastKey: 10 } } });
    const spy = mockResponses({
      bodies: [
        { 'ia::result': [{ key: '11' }, { key: '12' }], 'ia::meta': { next: 3 } },
        { 'ia::result': [{ key: '13' }], 'ia::meta': { next: null } },
      ],
    });
    const result = await sageIntacctPoll.pollNewRecordsByKey({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] });
    expect(result.map((r) => r['key'])).toEqual(['11', '12', '13']);
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      filters: [{ $gt: { key: '10' } }],
      orderBy: [{ key: 'asc' }],
    });
    expect(data[KEY]).toEqual({ lastKey: 13 });
  });

  it('leaves state untouched on an empty poll', async () => {
    const { store, data } = memoryStore({ initial: { [KEY]: { lastKey: 10 } } });
    mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    expect(await sageIntacctPoll.pollNewRecordsByKey({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).toEqual([]);
    expect(data[KEY]).toEqual({ lastKey: 10 });
  });

  it('does not write state when a later page fails', async () => {
    const { store, data } = memoryStore({ initial: { [KEY]: { lastKey: 10 } } });
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { 'ia::result': [{ key: '11' }], 'ia::meta': { next: 2 } } });
    spy.mockRejectedValueOnce(new HttpError('x', { status: 500, responseBody: {} }));
    await expect(sageIntacctPoll.pollNewRecordsByKey({ auth, store, storeKey: KEY, object: 'o', fields: ['key'] })).rejects.toThrow('HTTP 500');
    expect(data[KEY]).toEqual({ lastKey: 10 });
  });

  it('new_contact trigger queries without audit fields and test() orders by key', async () => {
    const contactRecord = { key: '7', id: 'Doe, Jane', printAs: 'Jane Doe', firstName: 'Jane', status: 'active' };
    const spy = mockResponses({ bodies: [{ 'ia::result': [contactRecord], 'ia::meta': { next: null } }] });
    const base = createMockPollingTriggerContext<typeof newContactTrigger.props>({ propsValue: {} });
    const result = await newContactTrigger.test({ ...base, auth });
    const body = requestAt({ spy, index: 0 }).body;
    expect(body).toMatchObject({ object: 'company-config/contact', orderBy: [{ key: 'desc' }], size: 5 });
    expect(JSON.stringify(body)).not.toContain('audit.');
    expect(result[0]).toMatchObject({ key: '7', id: 'Doe, Jane', first_name: 'Jane' });
    expect(result[0]).not.toHaveProperty('created_at');
  });
});

describe('invoices and bills', () => {
  const invoiceReadBack = {
    key: '1500',
    id: '1500',
    invoiceNumber: 'INV-100',
    state: 'posted',
    invoiceDate: '2026-11-24',
    dueDate: '2026-12-24',
    description: 'Services',
    customer: { id: 'APTEST-C1', name: 'AP Test Customer' },
    totalTxnAmount: '100.50',
    totalTxnAmountDue: '100.50',
    currency: { txnCurrency: 'USD' },
    audit: { createdDateTime: '2026-11-24T10:00:00Z', modifiedDateTime: '2026-11-24T10:00:00Z' },
  };

  it('create_invoice POSTs customer key, dates and lines then reads the invoice back', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '1500' } }, { 'ia::result': invoiceReadBack }] });
    const result = await createInvoiceAction.run(
      actionContext({
        propsValue: {
          customer_key: '40',
          invoice_date: '2026-11-24',
          due_date: '2026-12-24',
          invoice_number: 'INV-100',
          reference_number: undefined,
          description: ' Services ',
          lines: [{ gl_account_id: '4000', amount: 100.5, memo: '' }],
        },
      }),
    );
    const create = requestAt({ spy, index: 0 });
    expect(create.method).toBe(HttpMethod.POST);
    expect(create.url).toBe(`${BASE}/objects/accounts-receivable/invoice`);
    expect(create.body).toEqual({
      customer: { key: '40' },
      invoiceDate: '2026-11-24',
      dueDate: '2026-12-24',
      invoiceNumber: 'INV-100',
      description: 'Services',
      lines: [{ glAccount: { id: '4000' }, txnAmount: '100.50', dimensions: { customer: { key: '40' } } }],
    });
    expect(requestAt({ spy, index: 1 }).url).toBe(`${BASE}/objects/accounts-receivable/invoice/1500`);
    expect(result).toMatchObject({ key: '1500', invoice_number: 'INV-100', customer_id: 'APTEST-C1', total_amount: 100.5, currency: 'USD' });
  });

  it('create_invoice_ai references the customer by id and accepts string amounts in JSON lines', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '1500' } }, { 'ia::result': invoiceReadBack }] });
    await createInvoiceAiAction.run(
      actionContext({
        propsValue: {
          customer_id: 'APTEST-C1',
          invoice_date: '2026-11-24',
          due_date: '2026-12-24',
          invoice_number: undefined,
          reference_number: undefined,
          description: undefined,
          lines: [{ gl_account_id: '4000', amount: '250', memo: 'from agent', location_id: '100' }],
        },
      }),
    );
    expect(requestAt({ spy, index: 0 }).body).toEqual({
      customer: { id: 'APTEST-C1' },
      invoiceDate: '2026-11-24',
      dueDate: '2026-12-24',
      lines: [{ glAccount: { id: '4000' }, txnAmount: '250.00', memo: 'from agent', dimensions: { customer: { id: 'APTEST-C1' }, location: { id: '100' } } }],
    });
  });

  it('create_invoice_ai rejects bad dates, zero amounts and empty lines without calling the API', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const base = {
      customer_id: 'APTEST-C1',
      invoice_date: '2026-11-24',
      due_date: '2026-12-24',
      invoice_number: undefined,
      reference_number: undefined,
      description: undefined,
      lines: [{ gl_account_id: '4000', amount: 1 }],
    };
    await expect(createInvoiceAiAction.run(actionContext({ propsValue: { ...base, invoice_date: '24-11-2026' } }))).rejects.toThrow('YYYY-MM-DD');
    await expect(createInvoiceAiAction.run(actionContext({ propsValue: { ...base, lines: [] } }))).rejects.toThrow('non-empty');
    await expect(createInvoiceAiAction.run(actionContext({ propsValue: { ...base, lines: [{ gl_account_id: '4000', amount: 0 }] } }))).rejects.toThrow('not zero after rounding');
    await expect(createInvoiceAiAction.run(actionContext({ propsValue: { ...base, lines: [{ amount: 5 }] } }))).rejects.toThrow('gl_account_id');
    expect(spy).not.toHaveBeenCalled();
  });

  it('update_invoice PATCHes only the filled header fields and rejects an empty update', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '1500' } }, { 'ia::result': invoiceReadBack }] });
    await updateInvoiceAction.run(
      actionContext({
        propsValue: { invoice_key: '1500', invoice_date: undefined, due_date: '2027-01-15', invoice_number: undefined, reference_number: undefined, description: undefined },
      }),
    );
    const patch = requestAt({ spy, index: 0 });
    expect(patch.method).toBe(HttpMethod.PATCH);
    expect(patch.url).toBe(`${BASE}/objects/accounts-receivable/invoice/1500`);
    expect(patch.body).toEqual({ dueDate: '2027-01-15' });
    vi.restoreAllMocks();
    const idle = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      updateInvoiceAction.run(
        actionContext({
          propsValue: { invoice_key: '1500', invoice_date: undefined, due_date: undefined, invoice_number: undefined, reference_number: undefined, description: undefined },
        }),
      ),
    ).rejects.toThrow('at least one field');
    expect(idle).not.toHaveBeenCalled();
  });

  it('find_invoice queries by exact invoice number', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    const result = await findInvoiceAction.run(actionContext({ propsValue: { search_by: 'invoice_number', search_value: 'INV-100' } }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      object: 'accounts-receivable/invoice',
      filters: [{ $eq: { invoiceNumber: 'INV-100' } }],
    });
    expect(result).toEqual({ found: false, count: 0, truncated: false, records: [] });
  });

  it('find_invoices_by_date sends an inclusive range and rejects a reversed one', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    await findInvoicesByDateAction.run(actionContext({ propsValue: { from_date: '2026-01-01', to_date: '2026-12-31', customer_id: 'APTEST-C1' } }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      filters: [{ $gte: { invoiceDate: '2026-01-01' } }, { $lte: { invoiceDate: '2026-12-31' } }, { $eq: { 'customer.id': 'APTEST-C1' } }],
      orderBy: [{ invoiceDate: 'asc' }, { key: 'asc' }],
    });
    await expect(
      findInvoicesByDateAction.run(actionContext({ propsValue: { from_date: '2026-12-31', to_date: '2026-01-01', customer_id: undefined } })),
    ).rejects.toThrow('must not be after');
  });

  it('create_bill POSTs the vendor key and bill date as createdDate', async () => {
    const billReadBack = { key: '1600', id: '1600', billNumber: 'B-1', vendor: { id: 'APTEST-V1', name: 'AP Test Vendor' } };
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '1600' } }, { 'ia::result': billReadBack }] });
    const result = await createBillAction.run(
      actionContext({
        propsValue: {
          vendor_key: '65',
          bill_date: '2026-11-24',
          due_date: '2026-12-24',
          bill_number: 'B-1',
          reference_number: undefined,
          description: undefined,
          lines: [{ gl_account_id: '6000', amount: 250, memo: undefined }],
        },
      }),
    );
    expect(requestAt({ spy, index: 0 }).body).toEqual({
      vendor: { key: '65' },
      createdDate: '2026-11-24',
      dueDate: '2026-12-24',
      billNumber: 'B-1',
      lines: [{ glAccount: { id: '6000' }, txnAmount: '250.00', dimensions: { vendor: { key: '65' } } }],
    });
    expect(result).toMatchObject({ key: '1600', bill_number: 'B-1', vendor_id: 'APTEST-V1' });
  });

  it('update_bill PATCHes bill_date as createdDate and only the filled fields', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '1600' } }, { 'ia::result': { key: '1600', billNumber: 'B-1' } }] });
    await updateBillAction.run(
      actionContext({
        propsValue: { bill_key: '1600', bill_date: '2026-12-01', due_date: undefined, bill_number: undefined, reference_number: undefined, description: undefined },
      }),
    );
    const patch = requestAt({ spy, index: 0 });
    expect(patch.method).toBe(HttpMethod.PATCH);
    expect(patch.url).toBe(`${BASE}/objects/accounts-payable/bill/1600`);
    expect(patch.body).toEqual({ createdDate: '2026-12-01' });
    vi.restoreAllMocks();
    const idle = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      updateBillAction.run(
        actionContext({
          propsValue: { bill_key: '1600', bill_date: undefined, due_date: undefined, bill_number: undefined, reference_number: undefined, description: undefined },
        }),
      ),
    ).rejects.toThrow('at least one field');
    expect(idle).not.toHaveBeenCalled();
  });

  it('create_invoice_ai accepts lines as a JSON string', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': { key: '1500' } }, { 'ia::result': { key: '1500' } }] });
    await createInvoiceAiAction.run(
      actionContext({
        propsValue: {
          customer_id: 'APTEST-C1',
          invoice_date: '2026-11-24',
          due_date: '2026-12-24',
          invoice_number: undefined,
          reference_number: undefined,
          description: undefined,
          lines: JSON.stringify([{ gl_account_id: '4000', amount: 10 }]),
        },
      }),
    );
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      lines: [{ glAccount: { id: '4000' }, txnAmount: '10.00', dimensions: { customer: { id: 'APTEST-C1' } } }],
    });
  });

  it('find_bill queries by exact vendor id', async () => {
    const spy = mockResponses({ bodies: [{ 'ia::result': [], 'ia::meta': { next: null } }] });
    await findBillAction.run(actionContext({ propsValue: { search_by: 'vendor_id', search_value: 'APTEST-V1' } }));
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      object: 'accounts-payable/bill',
      filters: [{ $eq: { 'vendor.id': 'APTEST-V1' } }],
    });
  });

  it('new_ar_invoice trigger test() asks for the 5 newest invoices and maps them', async () => {
    const flatInvoice = {
      key: '1445',
      id: '1445',
      invoiceNumber: 'AR_Inv-00079',
      state: 'posted',
      'customer.id': 'C-1021',
      'customer.name': 'Resource Network',
      totalTxnAmount: '100000.01',
      'currency.txnCurrency': 'USD',
      'audit.createdDateTime': '2025-06-12T14:10:53Z',
    };
    const spy = mockResponses({ bodies: [{ 'ia::result': [flatInvoice], 'ia::meta': { next: null } }] });
    const base = createMockPollingTriggerContext<typeof newArInvoiceTrigger.props>({ propsValue: {} });
    const result = await newArInvoiceTrigger.test({ ...base, auth });
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({
      object: 'accounts-receivable/invoice',
      orderBy: [{ 'audit.createdDateTime': 'desc' }, { key: 'desc' }],
      size: 5,
    });
    expect(result[0]).toMatchObject({ key: '1445', invoice_number: 'AR_Inv-00079', customer_name: 'Resource Network', total_amount: 100000.01, currency: 'USD' });
  });

  it('new_payment_received trigger test() maps payments', async () => {
    const flatPayment = {
      key: '1412',
      id: '1412',
      paidDate: '2021-11-30',
      paymentMethod: 'printedCheck',
      state: 'complete',
      'customer.id': 'C-1001',
      'customer.name': 'Health Initiative 1',
      'txnCurrency.totalAmount': '2445.66',
      'txnCurrency.currency': 'USD',
      'audit.createdDateTime': '2022-03-30T20:15:45Z',
    };
    const spy = mockResponses({ bodies: [{ 'ia::result': [flatPayment], 'ia::meta': { next: null } }] });
    const base = createMockPollingTriggerContext<typeof newPaymentReceivedTrigger.props>({ propsValue: {} });
    const result = await newPaymentReceivedTrigger.test({ ...base, auth });
    expect(requestAt({ spy, index: 0 }).body).toMatchObject({ object: 'accounts-receivable/payment', size: 5 });
    expect(result[0]).toMatchObject({ key: '1412', payment_method: 'printedCheck', total_amount: 2445.66, customer_id: 'C-1001' });
  });
});
