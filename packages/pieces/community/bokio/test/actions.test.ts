import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { createCustomer } from '../src/lib/actions/create-customer';
import { findCustomer } from '../src/lib/actions/find-customer';
import { getDraftInvoiceByCustomerName } from '../src/lib/actions/get-draft-invoice-by-customer-name';
import { createInvoice } from '../src/lib/actions/create-invoice';
import { aiCreateInvoice } from '../src/lib/actions/ai-create-invoice';
import { aiUpdateInvoice } from '../src/lib/actions/ai-update-invoice';
import { aiCreateJournalEntry } from '../src/lib/actions/ai-create-journal-entry';
import { listInvoices } from '../src/lib/actions/list-invoices';
import { listAccounts } from '../src/lib/actions/list-accounts';
import { publishInvoice } from '../src/lib/actions/publish-invoice';
import { bokioAuth } from '../src/lib/common/auth';
import { bokio } from '../src';
import { invoiceIdDropdown, itemDetailsProps } from '../src/lib/common/props';
import { createAnItem } from '../src/lib/actions/create-an-item';
import { getCustomer } from '../src/lib/actions/get-customer';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { companyId: ' comp-1 ', api_key: ' key-1 ' };
const SERVER = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };
const BASE = 'https://api.bokio.se/v1/companies/comp-1';

function runAction({ action, propsValue }: RunActionParams): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue });
  return Reflect.apply(action.run, action, [{ ...base, auth: { type: 'CUSTOM_AUTH', props: AUTH } }]);
}

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

afterEach(() => {
  sendRequest.mockReset();
});

describe('piece metadata', () => {
  it('has the planned audiences and an outputSchema on every action except custom API call', () => {
    const actions = Object.values(bokio.actions());
    const count = (audience: string) => actions.filter((a) => a.audience === audience).length;
    expect(count('human')).toBe(6);
    expect(count('ai')).toBe(5);
    expect(count('both')).toBe(11);
    for (const action of actions) {
      if (action.name !== 'custom_api_call') {
        expect(action.outputSchema, action.name).toBeDefined();
        expect(action.aiMetadata, action.name).toBeDefined();
      }
    }
  });
});

describe('requests', () => {
  it('create customer posts camelCase body with trimmed auth', async () => {
    sendRequest.mockResolvedValue(ok({ id: '22222222-2222-4222-8222-222222222222' }));
    await runAction({
      action: createCustomer,
      propsValue: { customerName: 'Acme', type: 'company', vatNumber: 'SE1', email: 'x@y.se' },
    });
    const req = sendRequest.mock.calls[0][0];
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe(`${BASE}/customers`);
    expect(req.headers.Authorization).toBe('Bearer key-1');
    expect(req.body).toEqual({
      name: 'Acme',
      type: 'company',
      vatNumber: 'SE1',
      contactsDetails: [{ name: 'Acme', email: 'x@y.se', isDefault: true }],
    });
  });

  it('find customer sends an unquoted contains filter and clamps pageSize', async () => {
    sendRequest.mockResolvedValue(ok({ items: [{ id: '22222222-2222-4222-8222-222222222222' }], totalItems: 1, totalPages: 1, currentPage: 1 }));
    const result = await runAction({
      action: findCustomer,
      propsValue: { filterType: 'name', filterValue: 'John Doe', operator: 'contains', pageSize: 1000 },
    });
    expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ pageSize: '100', query: 'name~John Doe' });
    expect(result).toEqual({ items: [{ id: '22222222-2222-4222-8222-222222222222' }], totalItems: 1, totalPages: 1, currentPage: 1 });
  });

  it('draft invoices by name uses exact match and customerRef.id', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ items: [{ id: 'c-x', name: 'Acme AB' }, { id: '22222222-2222-4222-8222-222222222222', name: 'Acme' }] }))
      .mockResolvedValueOnce(ok({ items: [{ id: '11111111-1111-4111-8111-111111111111' }], totalItems: 1, totalPages: 1, currentPage: 1 }));
    const result = await runAction({ action: getDraftInvoiceByCustomerName, propsValue: { customerName: 'Acme' } });
    expect(sendRequest.mock.calls[0][0].queryParams.query).toBe('name==Acme');
    expect(sendRequest.mock.calls[1][0].queryParams.query).toBe('status==draft&&customerRef.id==22222222-2222-4222-8222-222222222222');
    expect(result).toMatchObject({ found: true, customerId: '22222222-2222-4222-8222-222222222222', items: [{ id: '11111111-1111-4111-8111-111111111111' }] });
  });

  it('draft invoices by name returns found=false without a second request', async () => {
    sendRequest.mockResolvedValueOnce(ok({ items: [{ id: 'c-x', name: 'Acme AB' }] }));
    const result = await runAction({ action: getDraftInvoiceByCustomerName, propsValue: { customerName: 'Acme' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ found: false, items: [], totalItems: 0 });
  });

  it('human create invoice puts description on the line and fixes legacy service', async () => {
    sendRequest.mockResolvedValue(ok({ id: '11111111-1111-4111-8111-111111111111' }));
    await runAction({
      action: createInvoice,
      propsValue: {
        invoiceDate: '2026-11-22',
        itemType: 'salesItem',
        dynamicProps: { description: 'Work', productType: 'service', quantity: 1, unitPrice: 10, taxRate: 25 },
      },
    });
    expect(sendRequest.mock.calls[0][0].body).toEqual({
      type: 'invoice',
      invoiceDate: '2026-11-22',
      lineItems: [
        { itemType: 'salesItem', description: 'Work', productType: 'services', quantity: 1, unitPrice: 10, taxRate: 25 },
      ],
    });
  });

  it('ai create invoice rejects a bad date before any request', async () => {
    await expect(
      runAction({
        action: aiCreateInvoice,
        propsValue: { invoiceDate: '2026-13-01', itemType: 'descriptionOnlyItem', description: 'x' },
      })
    ).rejects.toThrow(/YYYY-MM-DD|calendar/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('ai update invoice does GET then PUT and keeps the lines', async () => {
    const existing = { id: '11111111-1111-4111-8111-111111111111', status: 'draft', invoiceDate: '2026-11-01', lineItems: [{ id: 'l1' }] };
    sendRequest.mockResolvedValueOnce(ok(existing)).mockResolvedValueOnce(ok(existing));
    await runAction({ action: aiUpdateInvoice, propsValue: { invoiceId: '11111111-1111-4111-8111-111111111111', dueDate: '2026-12-31' } });
    expect(sendRequest.mock.calls[0][0].method).toBe(HttpMethod.GET);
    const put = sendRequest.mock.calls[1][0];
    expect(put.method).toBe(HttpMethod.PUT);
    expect(put.url).toBe(`${BASE}/invoices/11111111-1111-4111-8111-111111111111`);
    expect(put.body).toEqual({ ...existing, dueDate: '2026-12-31' });
  });

  it('ai journal entry validates balance before sending', async () => {
    await expect(
      runAction({
        action: aiCreateJournalEntry,
        propsValue: { title: 'T', date: '2026-11-22', lines: '[{"account":1930,"debit":1},{"account":3001,"credit":2}]' },
      })
    ).rejects.toThrow(/must equal credits/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('list invoices builds a combined filter', async () => {
    sendRequest.mockResolvedValue(ok({ items: [] }));
    await runAction({
      action: listInvoices,
      propsValue: { status: 'draft', customerId: '22222222-2222-4222-8222-222222222222', invoiceDateFrom: '2026-01-01', page: 2 },
    });
    expect(sendRequest.mock.calls[0][0].queryParams).toEqual({
      page: '2',
      query: 'status==draft&&customerRef.id==22222222-2222-4222-8222-222222222222&&invoiceDate>=2026-01-01',
    });
  });

  it('publish invoice posts to the publish endpoint', async () => {
    sendRequest.mockResolvedValue(ok({ id: '11111111-1111-4111-8111-111111111111', status: 'published' }));
    await runAction({ action: publishInvoice, propsValue: { invoiceId: '11111111-1111-4111-8111-111111111111' } });
    expect(sendRequest.mock.calls[0][0]).toMatchObject({ method: HttpMethod.POST, url: `${BASE}/invoices/11111111-1111-4111-8111-111111111111/publish` });
  });
});

describe('list accounts', () => {
  const accounts = Array.from({ length: 120 }, (_, i) => ({ account: 1000 + i, name: i % 2 === 0 ? `Bank ${i}` : `Sales ${i}`, accountType: 'asset' }));

  it('sends no paging params and limits a plain-array payload client-side', async () => {
    sendRequest.mockResolvedValue(ok(accounts));
    const result = await runAction({ action: listAccounts, propsValue: {} });
    expect(sendRequest.mock.calls[0][0].queryParams).toEqual({});
    expect(result).toMatchObject({ totalMatched: 120, returned: 50, truncated: true });
  });

  it('filters by name case-insensitively and by exact number', async () => {
    sendRequest.mockResolvedValue(ok(accounts));
    const byName = await runAction({ action: listAccounts, propsValue: { nameContains: 'SALES 1', limit: 1000 } });
    expect(byName).toMatchObject({ truncated: false });
    sendRequest.mockResolvedValue(ok(accounts));
    const byNumber = await runAction({ action: listAccounts, propsValue: { accountNumber: '1002' } });
    expect(byNumber).toEqual({ items: [accounts[2]], totalMatched: 1, returned: 1, truncated: false });
  });

  it('rejects a non-integer account number before any request', async () => {
    await expect(runAction({ action: listAccounts, propsValue: { accountNumber: '19.3' } })).rejects.toThrow(/whole number/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('errors', () => {
  it('surfaces the Bokio message and field errors', async () => {
    sendRequest.mockRejectedValue(
      new HttpError(null, {
        status: 400,
        responseBody: {
          code: 'validation-error',
          message: 'Validation failed',
          errors: [{ field: 'title', message: 'The title field is required' }],
        },
      })
    );
    await expect(runAction({ action: publishInvoice, propsValue: { invoiceId: '11111111-1111-4111-8111-111111111111' } })).rejects.toThrow(
      'Bokio publish invoice failed (HTTP 400, validation-error): Validation failed; title: The title field is required'
    );
  });

  it('auth validate distinguishes 401 and 404', async () => {
    sendRequest.mockRejectedValueOnce(new HttpError(null, { status: 401, responseBody: {} }));
    const invalid = await bokioAuth.validate?.({ auth: AUTH, server: SERVER });
    expect(invalid).toMatchObject({ valid: false, error: expect.stringMatching(/API Key/) });
    sendRequest.mockRejectedValueOnce(new HttpError(null, { status: 404, responseBody: {} }));
    const missing = await bokioAuth.validate?.({ auth: AUTH, server: SERVER });
    expect(missing).toMatchObject({ valid: false, error: expect.stringMatching(/Company not found/) });
    expect(sendRequest.mock.calls[0][0].url).toBe(`${BASE}/journal-entries`);
  });
});

type RunActionParams = {
  action: { run: (ctx: never) => Promise<unknown> };
  propsValue: Record<string, unknown>;
};

function propertyContext() {
  const { server, project, flows, connections } = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  return { server, project, flows, connections };
}

function loadInvoiceOptions(): Promise<unknown> {
  return invoiceIdDropdown.options({ auth: { type: 'CUSTOM_AUTH', props: AUTH } }, propertyContext());
}

function invoicePage({ page, totalPages }: { page: number; totalPages: number }) {
  return ok({
    items: [
      { id: `inv-${page}`, invoiceNumber: page, invoiceDate: '2026-11-01', customerRef: { name: 'Acme' } },
      { id: `nocustomer-${page}`, invoiceDate: '2026-11-02', customerRef: null },
    ],
    totalItems: totalPages * 2,
    totalPages,
    currentPage: page,
  });
}

describe('invoice dropdown', () => {
  it('lists only drafts with labels and stops at totalPages', async () => {
    sendRequest
      .mockResolvedValueOnce(invoicePage({ page: 1, totalPages: 2 }))
      .mockResolvedValueOnce(invoicePage({ page: 2, totalPages: 2 }));
    const result = await loadInvoiceOptions();
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ page: '1', pageSize: '100', query: 'status==draft' });
    expect(sendRequest.mock.calls[1][0].queryParams.page).toBe('2');
    expect(result).toEqual({
      disabled: false,
      options: [
        { label: '#1 - Acme (2026-11-01)', value: 'inv-1' },
        { label: '#draft (2026-11-02)', value: 'nocustomer-1' },
        { label: '#2 - Acme (2026-11-01)', value: 'inv-2' },
        { label: '#draft (2026-11-02)', value: 'nocustomer-2' },
      ],
    });
  });

  it('stops at the 20-page cap', async () => {
    sendRequest.mockImplementation(async (req: { queryParams: { page: string } }) =>
      invoicePage({ page: Number(req.queryParams.page), totalPages: 50 })
    );
    await loadInvoiceOptions();
    expect(sendRequest).toHaveBeenCalledTimes(20);
  });

  it('shows a disabled placeholder on error', async () => {
    sendRequest.mockRejectedValue(new HttpError(null, { status: 401, responseBody: { message: 'Unauthorized' } }));
    const result = await loadInvoiceOptions();
    expect(result).toMatchObject({ disabled: true, options: [], placeholder: expect.stringMatching(/Unauthorized/) });
  });
});

describe('create an item dynamic props', () => {
  it('shows only description for a description-only item', async () => {
    const props = await itemDetailsProps.props({ itemType: 'descriptionOnlyItem' }, propertyContext());
    expect(Object.keys(props)).toEqual(['description']);
  });

  it('requires every field the API needs for a sales item and nothing run() ignores', async () => {
    const props = await itemDetailsProps.props({ itemType: 'salesItem' }, propertyContext());
    expect(Object.keys(props).sort()).toEqual(['description', 'productType', 'taxRate', 'unitPrice', 'unitType']);
    for (const prop of Object.values(props)) {
      expect(prop.required).toBe(true);
    }
  });

  it('posts the item built from dynamic props', async () => {
    sendRequest.mockResolvedValue(ok({ id: '33333333-3333-4333-8333-333333333333' }));
    await runAction({
      action: createAnItem,
      propsValue: {
        itemType: 'salesItem',
        dynamicProps: { description: 'Hour', productType: 'services', unitType: 'hour', unitPrice: 900, taxRate: 25 },
      },
    });
    expect(sendRequest.mock.calls[0][0].body).toEqual({
      itemType: 'salesItem',
      description: 'Hour',
      productType: 'services',
      unitType: 'hour',
      unitPrice: 900,
      taxRate: 25,
    });
  });
});

describe('id validation', () => {
  it('rejects a non-UUID customer id before calling Bokio', async () => {
    await expect(runAction({ action: getCustomer, propsValue: { customerId: 'abc' } })).rejects.toThrow(
      'Customer ID must be a Bokio UUID (got "abc"). Get it from Find Customer.'
    );
    await expect(
      runAction({
        action: aiCreateInvoice,
        propsValue: { invoiceDate: '2026-11-22', customerId: 'abc', itemType: 'descriptionOnlyItem', description: 'x' },
      })
    ).rejects.toThrow(/Customer ID must be a Bokio UUID/);
    await expect(runAction({ action: publishInvoice, propsValue: { invoiceId: 'abc' } })).rejects.toThrow(
      /Invoice ID must be a Bokio UUID .*List Invoices/
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('allows negative quantity and price for credit lines', async () => {
    sendRequest.mockResolvedValue(ok({ id: '11111111-1111-4111-8111-111111111111' }));
    await runAction({
      action: aiCreateInvoice,
      propsValue: {
        invoiceDate: '2026-11-22',
        itemType: 'salesItem',
        description: 'Refund',
        productType: 'goods',
        quantity: -1,
        unitPrice: -50,
        taxRate: 25,
      },
    });
    expect(sendRequest.mock.calls[0][0].body.lineItems[0]).toMatchObject({ quantity: -1, unitPrice: -50 });
  });
});
