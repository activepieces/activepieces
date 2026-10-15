import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { XeroApiError, xeroApi, xeroInput } from '../src/lib/common/client';
import { aiInput } from '../src/lib/common/ai-props';
import { requestedHeaders, requestedUrl, stubFetch, stubFetchSequence } from './helpers';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function withFakeTimers<T>(run: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  const pending = run();
  await vi.advanceTimersByTimeAsync(30000);
  return pending;
}

function get() {
  return xeroApi.request<unknown>({
    accessToken: 'tok_test',
    tenantId: 'org-1',
    method: HttpMethod.GET,
    url: 'https://api.xero.com/api.xro/2.0/Contacts',
    operation: 'list contacts',
  });
}

describe('xeroApi.request rate limits and errors', () => {
  it('sends the bearer token and tenant header', async () => {
    const fetchMock = stubFetch({ status: 200, body: { Contacts: [] } });
    await get();
    expect(requestedUrl({ fetchMock })).toBe('https://api.xero.com/api.xro/2.0/Contacts');
    expect(requestedHeaders({ fetchMock }).get('authorization')).toBe('Bearer tok_test');
    expect(requestedHeaders({ fetchMock }).get('xero-tenant-id')).toBe('org-1');
  });

  it('retries once after a 429 and returns the second response', async () => {
    const fetchMock = stubFetchSequence({ responses: [{ status: 429, body: {} }, { status: 200, body: { Contacts: [{ ContactID: 'c1' }] } }] });
    await expect(withFakeTimers(() => get())).resolves.toEqual({ Contacts: [{ ContactID: 'c1' }] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws a named rate-limit error after a second 429', async () => {
    const fetchMock = stubFetchSequence({ responses: [{ status: 429, body: { Title: 'Too Many Requests' } }] });
    const error = await withFakeTimers(() => get().catch((e: unknown) => e));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(error).toBeInstanceOf(XeroApiError);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('60 calls per minute');
    expect(Reflect.get(Object(error), 'status')).toBe(429);
    expect(Object.keys(Object(error))).not.toContain('body');
    expect(Reflect.get(Object(error), 'responseBody')).toEqual({ Title: 'Too Many Requests' });
  });

  it('waits 30 seconds before the single retry', async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetchSequence({ responses: [{ status: 429, body: {} }, { status: 200, body: { ok: true } }] });
    const pending = get();
    await vi.advanceTimersByTimeAsync(29000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('bounds the error message and the vendor body kept on the error', async () => {
    const longMessage = 'x'.repeat(1500);
    stubFetch({ status: 400, body: { Message: longMessage, Elements: Array.from({ length: 40 }, () => ({ Name: 'y'.repeat(100) })) } });
    const error = await get().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(XeroApiError);
    expect(String(Reflect.get(Object(error), 'message')).length).toBeLessThan(1200);
    const kept = Reflect.get(Object(error), 'responseBody');
    expect(typeof kept === 'string' && kept.length).toBeLessThanOrEqual(4001);
    expect(String(Reflect.get(Object(error), 'message'))).not.toContain('tok_test');
  });

  it('puts Xero validation messages into the error message', async () => {
    stubFetch({
      status: 400,
      body: {
        ErrorNumber: 10,
        Type: 'ValidationException',
        Message: 'A validation exception occurred',
        Elements: [{ ValidationErrors: [{ Message: 'Account code \'999\' is not a valid code for this document.' }] }],
      },
    });
    await expect(get()).rejects.toThrow("Xero list contacts failed (HTTP 400): Account code '999' is not a valid code for this document.");
  });

  it('does not retry other errors', async () => {
    const fetchMock = stubFetch({ status: 500, body: { Message: 'boom' } });
    await expect(get()).rejects.toThrow('HTTP 500');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('where clauses', () => {
  it('escapes double quotes by doubling them, as Xero requires', () => {
    expect(xeroInput.whereString({ value: 'Bob "The Builder"' })).toBe('"Bob ""The Builder"""');
  });

  it('only accepts GUIDs inside guid()', () => {
    expect(xeroInput.whereGuid({ value: ' 6d42f03b-181f-43e3-93fb-2025c012de92 ', field: 'Contact' })).toBe('guid("6d42f03b-181f-43e3-93fb-2025c012de92")');
    expect(() => xeroInput.whereGuid({ value: '") OR (1==1', field: 'Contact' })).toThrow('Contact must be a Xero ID');
  });

  it('validates calendar dates', () => {
    expect(xeroInput.parseDateInput({ value: '2026-02-28', field: 'Date' })).toBe('2026-02-28');
    expect(() => xeroInput.parseDateInput({ value: '2026-02-30', field: 'Date' })).toThrow('not a valid calendar date');
    expect(() => xeroInput.parseDateInput({ value: '28/02/2026', field: 'Date' })).toThrow('YYYY-MM-DD');
    expect(xeroInput.whereDate({ value: '2026-02-08' })).toBe('DateTime(2026, 2, 8)');
  });
});

describe('decimal precision', () => {
  it('keeps up to the allowed decimal places exactly', () => {
    expect(xeroInput.parseDecimal({ value: '10.1234', field: 'UnitAmount', maxDecimals: 4 })).toBe(10.1234);
    expect(xeroInput.parseDecimal({ value: 0.1, field: 'Amount', maxDecimals: 2 })).toBe(0.1);
  });

  it('rejects values that would be rounded or lose precision', () => {
    expect(() => xeroInput.parseDecimal({ value: '10.12345', field: 'UnitAmount', maxDecimals: 4 })).toThrow('at most 4 decimal places');
    expect(() => xeroInput.parseDecimal({ value: '1234567890123456', field: 'Amount', maxDecimals: 2 })).toThrow('15 significant digits');
    expect(() => xeroInput.parseDecimal({ value: '1e5', field: 'Amount', maxDecimals: 2 })).toThrow('plain number');
    expect(() => xeroInput.parseDecimal({ value: '0', field: 'Amount', maxDecimals: 2, positive: true })).toThrow('greater than zero');
  });

  it('checks that journal lines balance with exact arithmetic', () => {
    const lines = aiInput.parseJournalLines({
      value: [
        { LineAmount: 0.1, AccountCode: '400' },
        { LineAmount: 0.2, AccountCode: '400' },
        { LineAmount: -0.3, AccountCode: '800' },
      ],
    });
    expect(lines).toHaveLength(3);
    expect(() =>
      aiInput.parseJournalLines({
        value: [
          { LineAmount: 100, AccountCode: '400' },
          { LineAmount: -99.99, AccountCode: '800' },
        ],
      }),
    ).toThrow('they add up to 0.01');
  });
});

describe('pagination caps', () => {
  it('defaults to page 1 with the maximum page size and refuses larger pages', () => {
    expect(xeroInput.pageParams({ page: undefined, pageSize: undefined, maxPageSize: 100 })).toEqual({ page: 1, pageSize: 100 });
    expect(() => xeroInput.pageParams({ page: 1, pageSize: 101, maxPageSize: 100 })).toThrow('1 to 100');
    expect(() => xeroInput.pageParams({ page: 0, pageSize: 10, maxPageSize: 100 })).toThrow('Page must be');
  });

  it('uses Xero pagination metadata when present, otherwise a full page means more', () => {
    expect(xeroApi.pageResult({ body: { Invoices: [{}, {}], pagination: { page: 1, pageCount: 1 } }, key: 'Invoices', page: 1, pageSize: 2 }).hasMore).toBe(false);
    expect(xeroApi.pageResult({ body: { Invoices: [{}, {}] }, key: 'Invoices', page: 1, pageSize: 2 }).hasMore).toBe(true);
    expect(xeroApi.pageResult({ body: { Invoices: [{}] }, key: 'Invoices', page: 1, pageSize: 2 }).hasMore).toBe(false);
  });
});

describe('organisation resolution for AI actions', () => {
  it('uses the given organisation without calling Xero', async () => {
    const fetchMock = stubFetch({ status: 200, body: [] });
    await expect(xeroApi.resolveTenantId({ accessToken: 't', tenantId: ' org-9 ' })).resolves.toBe('org-9');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the only connected organisation', async () => {
    stubFetch({ status: 200, body: [{ id: 'c1', tenantId: 'org-1', tenantType: 'ORGANISATION', tenantName: 'Demo' }] });
    await expect(xeroApi.resolveTenantId({ accessToken: 't', tenantId: undefined })).resolves.toBe('org-1');
  });

  it('asks for an organisation when several are connected', async () => {
    stubFetch({
      status: 200,
      body: [
        { id: 'c1', tenantId: 'org-1', tenantType: 'ORGANISATION', tenantName: 'Demo' },
        { id: 'c2', tenantId: 'org-2', tenantType: 'ORGANISATION', tenantName: 'Second' },
      ],
    });
    await expect(xeroApi.resolveTenantId({ accessToken: 't', tenantId: '' })).rejects.toThrow('Demo (org-1), Second (org-2)');
  });
});
