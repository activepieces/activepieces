import { httpClient } from '@activepieces/pieces-common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoiceninja } from '../src';
import { InvoiceNinjaApiError, invoiceNinjaClient } from '../src/lib/common/client';

const auth = { props: { base_url: 'https://invoices.example.com/', access_token: 'tok-secret' } };

function action(name: string) {
  const found = invoiceninja.actions()[name];
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function mockResponses(bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  return spy;
}

function runAction({ name, propsValue = {} }: { name: string; propsValue?: Record<string, unknown> }) {
  return Reflect.apply(action(name).run, undefined, [{ auth, propsValue }]);
}

function requestOf({ spy, index = 0 }: { spy: ReturnType<typeof mockResponses>; index?: number }) {
  return spy.mock.calls[index][0];
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('normalizeBaseUrl', () => {
  it('strips trailing slashes and a pasted /api/v1', () => {
    expect(invoiceNinjaClient.normalizeBaseUrl('https://invoicing.co/')).toBe('https://invoicing.co');
    expect(invoiceNinjaClient.normalizeBaseUrl(' http://localhost:8090/api/v1/ ')).toBe('http://localhost:8090');
    expect(invoiceNinjaClient.normalizeBaseUrl('https://h.example.com/ninja')).toBe('https://h.example.com/ninja');
  });
  it.each(['ftp://h.example.com', 'https://u:p@h.example.com', 'https://h.example.com/?x=1', 'https://h.example.com/#a', 'https://h.example.com/%2e%2e/x', 'h.example.com', ''])(
    'rejects %s',
    (value) => {
      expect(() => invoiceNinjaClient.normalizeBaseUrl(value)).toThrow();
    },
  );
});

describe('isSameOrigin', () => {
  it('rejects lookalike hosts and other paths', () => {
    const baseUrl = 'https://invoices.example.com/api/v1';
    expect(invoiceNinjaClient.isSameOrigin({ url: 'https://invoices.example.com/api/v1/clients', baseUrl })).toBe(true);
    expect(invoiceNinjaClient.isSameOrigin({ url: 'https://invoices.example.com.evil.io/api/v1/clients', baseUrl })).toBe(false);
    expect(invoiceNinjaClient.isSameOrigin({ url: 'https://invoices.example.com/other', baseUrl })).toBe(false);
    expect(invoiceNinjaClient.isSameOrigin({ url: 'https://x@invoices.example.com/api/v1', baseUrl })).toBe(false);
  });
});

describe('ids, dates and line items', () => {
  it('accepts hashed ids only', () => {
    expect(invoiceNinjaClient.parseId({ value: ' VolejRejNm ', label: 'ID' })).toBe('VolejRejNm');
    expect(() => invoiceNinjaClient.parseId({ value: 'a/../b', label: 'ID' })).toThrow();
    expect(() => invoiceNinjaClient.parseId({ value: '', label: 'ID' })).toThrow();
  });
  it('keeps the calendar date of an ISO date-time', () => {
    expect(invoiceNinjaClient.toDateOnly({ value: '2026-12-01T23:30:00.000Z', label: 'D' })).toBe('2026-12-01');
    expect(invoiceNinjaClient.toDateOnly({ value: '', label: 'D' })).toBeUndefined();
    expect(() => invoiceNinjaClient.toDateOnly({ value: '01/12/2026', label: 'D' })).toThrow();
  });
  it('maps line items and parses numeric strings', () => {
    expect(invoiceNinjaClient.lineItemsOf({ value: [{ notes: 'x', cost: '10', quantity: '2' }], label: 'L', required: true })).toEqual([
      { notes: 'x', cost: 10, quantity: 2 },
    ]);
    expect(() => invoiceNinjaClient.lineItemsOf({ value: [{ cost: 1 }], label: 'L', required: true })).toThrow();
    expect(() => invoiceNinjaClient.lineItemsOf({ value: [], label: 'L', required: true })).toThrow();
  });
  it('gives each line the document discount type', () => {
    expect(invoiceNinjaClient.lineItemsOf({ value: [{ notes: 'x', discount: 5 }], label: 'L', required: true, isAmountDiscount: true })).toEqual([
      { notes: 'x', quantity: 1, discount: 5, is_amount_discount: true },
    ]);
  });
});

describe('requests', () => {
  it('sends the token, X-Requested-With and no redirects', async () => {
    const spy = mockResponses([{ data: { id: 'Abc123' } }]);
    await runAction({ name: 'get_client', propsValue: { id: 'Abc123' } });
    const request = requestOf({ spy });
    expect(request.url).toBe('https://invoices.example.com/api/v1/clients/Abc123');
    expect(request.headers).toMatchObject({ 'X-API-TOKEN': 'tok-secret', 'X-Requested-With': 'XMLHttpRequest' });
    expect(request.followRedirects).toBe(false);
  });

  it('create_client sends a JSON body with a contacts array and no query string', async () => {
    const spy = mockResponses([{ data: { id: 'C1', contacts: [{ password: 'x', email: 'a@b.co' }] } }]);
    const result = await runAction({
      name: 'create_client',
      propsValue: { client_business_name: 'Acme', client_email: 'a@b.co', client_address1: '1 St', client_city: 'Rome', client_send_email: true },
    });
    const request = requestOf({ spy });
    expect(request.url).toBe('https://invoices.example.com/api/v1/clients');
    expect(request.queryParams).toEqual({});
    expect(request.body).toEqual({
      name: 'Acme',
      address1: '1 St',
      city: 'Rome',
      contacts: [{ email: 'a@b.co', send_email: true, is_primary: true }],
    });
    expect(result).toEqual({ data: { id: 'C1', contacts: [{ email: 'a@b.co' }] } });
  });

  it('create_task sends its fields in the body', async () => {
    const spy = mockResponses([{ data: { id: 'T1' } }]);
    await runAction({ name: 'create_task', propsValue: { number: 'T-1', description: 'Work', client_id: 'C1', rate: 0 } });
    expect(requestOf({ spy }).body).toEqual({ number: 'T-1', description: 'Work', client_id: 'C1', rate: 0 });
  });

  it('list actions return paging info', async () => {
    mockResponses([{ data: [{ id: 'A' }], meta: { pagination: { total: 41, total_pages: 3 } } }]);
    const result = await runAction({ name: 'find_clients', propsValue: { search: 'acme', page: 2, per_page: 20 } });
    expect(result).toEqual({ items: [{ id: 'A' }], page: 2, perPage: 20, total: 41, hasMore: true });
  });

  it('update_client sends only given fields plus cleared ones', async () => {
    const spy = mockResponses([{ data: { id: 'C1' } }]);
    await runAction({ name: 'update_client', propsValue: { client_id: 'C1', city: 'Paris', clear_fields: ['website'] } });
    expect(requestOf({ spy }).body).toEqual({ website: '', city: 'Paris' });
  });

  it('update_client refuses an empty update', async () => {
    await expect(runAction({ name: 'update_client', propsValue: { client_id: 'C1' } })).rejects.toThrow('Nothing to update');
  });
});

describe('errors', () => {
  it('throws InvoiceNinjaApiError with the vendor message instead of returning a string', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      Object.assign(new Error('x'), { response: { status: 422, body: { message: 'The given data was invalid.', errors: { client_id: ['Client is required'] } } } }),
    );
    const promise = runAction({ name: 'getclient_task', propsValue: { email: 'a@b.co' } });
    await expect(promise).rejects.toBeInstanceOf(InvoiceNinjaApiError);
    await expect(runAction({ name: 'getclient_task', propsValue: { email: 'a@b.co' } })).rejects.toThrow('client_id: Client is required');
  });

  it('getclient_task returns false when no client matches', async () => {
    mockResponses([{ data: [], meta: { pagination: { total: 0, total_pages: 1 } } }]);
    expect(await runAction({ name: 'getclient_task', propsValue: { email: 'a@b.co' } })).toBe(false);
  });

  it('getinvoices_task copes with an invoice without line items', async () => {
    mockResponses([{ data: [{ number: '1', line_items: [] }], meta: { pagination: { total: 1, total_pages: 1 } } }]);
    const result = await runAction({ name: 'getinvoices_task', propsValue: { invoiceStatus: 'all' } });
    expect(result).toEqual([expect.objectContaining({ invoice: expect.objectContaining({ invoiceno: '1', firstsku: null }) })]);
  });
});

describe('legacy create_invoice', () => {
  it('matches the product key exactly and sends a date-only due date', async () => {
    const spy = mockResponses([
      { data: [{ product_key: 'W&1-extra', price: 99 }, { product_key: 'W&1', price: 12.5, notes: 'Widget' }], meta: { pagination: { total: 2, total_pages: 1 } } },
      { data: { id: 'I1' } },
    ]);
    await runAction({
      name: 'create_invoice',
      propsValue: { client_id: 'C1', discount: 0, discount_type: true, order_items_json: '[{"quantity":2,"product_key":"W&1","discount":"0"}]', send_email: false, mark_sent: true, due_date: '2026-12-01T23:30:00.000Z' },
    });
    expect(requestOf({ spy, index: 0 }).queryParams).toMatchObject({ product_key: 'W&1' });
    const body = requestOf({ spy, index: 1 }).body;
    expect(body).toMatchObject({ client_id: 'C1', due_date: '2026-12-01', line_items: [expect.objectContaining({ product_key: 'W&1', cost: 12.5 })] });
    expect(requestOf({ spy, index: 1 }).queryParams).toEqual({ mark_sent: 'true' });
  });

  it('rejects invalid JSON with a clear message', async () => {
    await expect(
      runAction({ name: 'create_invoice', propsValue: { client_id: 'C1', discount: 0, discount_type: true, order_items_json: '{bad' } }),
    ).rejects.toThrow('not valid JSON');
  });
});

describe('legacy create_recurring_invoice', () => {
  const product = { data: [{ product_key: 'W1', price: 10 }], meta: { pagination: { total: 1, total_pages: 1 } } };
  const base = { client_id: 'C1', discount: 0, discount_type: true, order_items_json: '[{"quantity":1,"product_key":"W1","discount":"0"}]', due_date: '2026-12-01T00:00:00.000Z' };

  it('a supplied override wins over the chosen frequency, as saved steps expect', async () => {
    const spy = mockResponses([product, { data: { id: 'R1' } }]);
    await runAction({ name: 'create_recurring_invoice', propsValue: { ...base, frequency: 5, auto_frequency: 7 } });
    expect(requestOf({ spy, index: 1 }).body).toMatchObject({ frequency_id: '7', next_send_date: '2026-12-01' });
  });

  it('uses the chosen frequency when no override is given', async () => {
    const spy = mockResponses([product, { data: { id: 'R1' } }]);
    await runAction({ name: 'create_recurring_invoice', propsValue: { ...base, frequency: 5 } });
    expect(requestOf({ spy, index: 1 }).body).toMatchObject({ frequency_id: '5' });
  });

  it('"Use override below" without an override is rejected', async () => {
    await expect(runAction({ name: 'create_recurring_invoice', propsValue: { ...base, frequency: 0 } })).rejects.toThrow('Choose a billing frequency');
  });
});

describe('getreport_task', () => {
  const preview = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'report-preview-clients.json'), 'utf8'));
  const jobId = 'b5f785dc-3a04-4ac2-ad53-305d5de0b188';
  const stillWorking = Object.assign(new Error('x'), { response: { status: 409, body: { message: 'Still working.....' } } });

  it('starts the job, retries on 409 and maps the preview to columns and rows', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { message: jobId } });
    spy.mockRejectedValueOnce(stillWorking);
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: preview });
    const promise = runAction({ name: 'getreport_task', propsValue: { reportType: 'clients' } });
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await promise;
    expect(spy).toHaveBeenCalledTimes(3);
    expect(requestOf({ spy, index: 0 }).url).toBe('https://invoices.example.com/api/v1/reports/clients');
    expect(requestOf({ spy, index: 0 }).queryParams).toEqual({ output: 'json' });
    expect(requestOf({ spy, index: 0 }).body).toMatchObject({ date_range: 'all', send_email: false });
    expect(requestOf({ spy, index: 2 }).url).toBe(`https://invoices.example.com/api/v1/reports/preview/${jobId}`);
    expect(result).toEqual({
      reportType: 'clients',
      columns: [
        { identifier: 'client.name', display_value: 'Name' },
        { identifier: 'client.number', display_value: 'Number' },
        { identifier: 'client.user', display_value: 'Client User' },
        { identifier: 'client.assigned_user', display_value: 'Client Assigned User' },
      ],
      rows: [{ 'client.name': 'Report Fixture Co', 'client.number': '0004', 'client.user': 'New User', 'client.assigned_user': '' }],
      rowCount: 1,
    });
  });

  it('keeps row order numeric and applies Max Rows', async () => {
    vi.useFakeTimers();
    const row = (name: string) => preview['0'].map((cell: Record<string, unknown>) => (cell['identifier'] === 'client.name' ? { ...cell, display_value: name } : cell));
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { message: jobId } });
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { columns: preview.columns, '10': row('ten'), '2': row('two'), '0': row('zero') } });
    const promise = runAction({ name: 'getreport_task', propsValue: { reportType: 'clients', numberOfResults: 2 } });
    await vi.advanceTimersByTimeAsync(3_000);
    const result = await promise;
    expect(result.rows.map((r: Record<string, unknown>) => r['client.name'])).toEqual(['zero', 'two']);
    expect(result.rowCount).toBe(2);
  });

  it('gives up with a clear message when the job is still running after 60 seconds', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { message: jobId } });
    spy.mockRejectedValue(stillWorking);
    const promise = runAction({ name: 'getreport_task', propsValue: { reportType: 'clients' } });
    const assertion = expect(promise).rejects.toThrow('was not ready after 60 seconds');
    await vi.advanceTimersByTimeAsync(62_000);
    await assertion;
  });

  it('bounds every poll timeout by the time left before the deadline', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { message: jobId } });
    spy.mockRejectedValue(stillWorking);
    const promise = runAction({ name: 'getreport_task', propsValue: { reportType: 'clients' } });
    const assertion = expect(promise).rejects.toThrow('was not ready after 60 seconds');
    await vi.advanceTimersByTimeAsync(62_000);
    await assertion;
    const timeouts = spy.mock.calls.slice(1).map((call) => call[0].timeout ?? 0);
    expect(timeouts.length).toBeGreaterThan(1);
    expect(timeouts[timeouts.length - 1]).toBeLessThanOrEqual(2_000);
    expect(timeouts.every((timeout) => timeout <= 58_000)).toBe(true);
  });

  it('does not retry other errors', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { message: jobId } });
    spy.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 500, body: { message: 'Server Error' } } }));
    const promise = runAction({ name: 'getreport_task', propsValue: { reportType: 'clients' } });
    const assertion = expect(promise).rejects.toThrow('Server Error');
    await vi.advanceTimersByTimeAsync(3_000);
    await assertion;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('rejects a start response without a job ID', async () => {
    mockResponses([{ message: 'nope' }]);
    await expect(runAction({ name: 'getreport_task', propsValue: { reportType: 'clients' } })).rejects.toThrow('did not return a report job ID');
  });
});

describe('metadata', () => {
  it('has the expected audiences and an outputSchema on every action but the custom call', () => {
    const actions = Object.values(invoiceninja.actions());
    const human = actions.filter((a) => a.audience === 'human').map((a) => a.name).sort();
    expect(human).toEqual(
      ['action_recurring_invoice', 'create_invoice', 'create_recurring_invoice', 'create_task', 'custom_api_call', 'exists_task', 'getclient_task', 'getinvoices_task', 'getreport_task'].sort(),
    );
    expect(actions.filter((a) => a.audience === 'both').map((a) => a.name)).toEqual(['create_client']);
    expect(actions.filter((a) => a.name !== 'custom_api_call' && !a.outputSchema)).toEqual([]);
  });
});
