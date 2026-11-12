import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../src/lib/common/client';
import { CUSTOMER_STATS_FIELDS, sallaCustomers } from '../src/lib/common/customers';
import { sallaProps } from '../src/lib/common/props';
import { sallaWebhooks } from '../src/lib/common/webhooks';

const auth = { access_token: 'token' };

function ok(body: unknown) {
  return respond({ body, status: 200 });
}

function respond({ body, status }: { body: unknown; status: number }) {
  return { status, headers: {}, body };
}

function pathOf(request: HttpRequest): string {
  return new URL(request.url).pathname.replace('/admin/v2', '');
}

function paramsOf(request: HttpRequest): URLSearchParams {
  return new URL(request.url).searchParams;
}

const onePage = { currentPage: 1, totalPages: 1 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getCustomer', () => {
  it('GETs /customers/{id} without fields[] by default', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 7, first_name: 'Ali', last_name: 'Saleh' } }));
    const result = await sallaCustomers.getCustomer({ auth, customerId: ' 7 ' });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.GET);
    expect(sent.url).toBe(`${BASE_URL}/customers/7`);
    expect(result).toMatchObject({ id: 7, full_name: 'Ali Saleh' });
    expect(result).not.toHaveProperty('orders_count');
  });

  it('asks for every stats field with fields[] when stats are on', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: { id: 7, stats: { orders_count: 4, orders_amount: { amount: 900, currency: 'SAR' } } } }),
    );
    const result = await sallaCustomers.getCustomer({ auth, customerId: 7, includeStats: true });
    const sent = spy.mock.calls[0][0];
    expect(pathOf(sent)).toBe('/customers/7');
    expect(paramsOf(sent).getAll('fields[]')).toEqual(CUSTOMER_STATS_FIELDS);
    expect(result).toMatchObject({ orders_count: 4, orders_amount: 900 });
  });

  it('rejects a non-numeric ID before calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaCustomers.getCustomer({ auth, customerId: 'ali@example.com' })).rejects.toThrow('Customer ID must be a numeric Salla ID');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('createCustomer', () => {
  it('POSTs the built body to /customers and adds the flat keys', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      respond({ body: { data: { id: 9, first_name: 'Ali', last_name: 'Saleh', mobile: 501234567, mobile_code: '+966' } }, status: 201 }),
    );
    const result = await sallaCustomers.createCustomer({
      auth,
      input: { firstName: 'Ali', lastName: 'Saleh', mobile: '0501234567', countryCode: 'SA', groupIds: ['3'] },
    });
    const sent = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe(`${BASE_URL}/customers`);
    expect(sent.retries).toBe(0);
    expect(sent.body).toEqual({
      first_name: 'Ali',
      last_name: 'Saleh',
      mobile: '501234567',
      mobile_code_country: '+966',
      country_code: 'SA',
      groups: [3],
    });
    expect(result).toMatchObject({ id: 9, full_name: 'Ali Saleh', mobile_full: '+966501234567' });
  });

  it('does not call Salla for invalid input', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaCustomers.createCustomer({ auth, input: { firstName: 'Ali', lastName: 'Saleh', mobile: '' } })).rejects.toThrow('mobile number');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('createCustomer refuses a mobile or email another customer already has', () => {
  const existing = { id: 19041486, first_name: 'APcloud2', last_name: 'Tester', mobile: 551119876, mobile_code: '+966', email: 'apcloud.c1.tester2@example.com' };

  function mockSearch(found: (keyword: string) => unknown[]) {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (request.method === HttpMethod.GET) {
        return ok({ data: found(paramsOf(request).get('keyword') ?? ''), pagination: onePage });
      }
      return respond({ body: { data: { id: 77, first_name: 'Dup', last_name: 'Probe' } }, status: 201 });
    });
  }

  it('sends nothing when the mobile belongs to another customer, because Salla would overwrite that customer', async () => {
    const spy = mockSearch((keyword) => (keyword === '551119876' ? [existing] : []));
    await expect(
      sallaCustomers.createCustomer({ auth, input: { firstName: 'Dup', lastName: 'Probe', mobile: '+966 0551119876', email: 'dup.probe@example.com' } }),
    ).rejects.toThrow('Customer 19041486 already has the mobile +966551119876');
    expect(spy.mock.calls.map(([request]) => request.method)).toEqual([HttpMethod.GET]);
  });

  it('sends nothing when the email belongs to another customer, whatever its letter case', async () => {
    const spy = mockSearch((keyword) => (keyword === 'apcloud.c1.tester2@example.com' ? [existing] : []));
    await expect(
      sallaCustomers.createCustomer({ auth, input: { firstName: 'Dup', lastName: 'Probe', mobile: '+966551119111', email: ' APCloud.C1.Tester2@example.com ' } }),
    ).rejects.toThrow('Customer 19041486 already has the email apcloud.c1.tester2@example.com');
    expect(spy.mock.calls.every(([request]) => request.method === HttpMethod.GET)).toBe(true);
  });

  it('creates the customer when the search only finds partial matches', async () => {
    const spy = mockSearch(() => [
      { ...existing, mobile: 5511198760, email: 'other@example.com' },
      { ...existing, mobile_code: '+971', email: 'apcloud.c1.tester2@example.com.sa' },
    ]);
    const result = await sallaCustomers.createCustomer({
      auth,
      input: { firstName: 'Dup', lastName: 'Probe', mobile: '+966551119876', email: 'apcloud.c1.tester2@example.com' },
    });
    expect(spy.mock.calls.map(([request]) => request.method)).toEqual([HttpMethod.GET, HttpMethod.GET, HttpMethod.POST]);
    expect(result).toMatchObject({ id: 77 });
  });

  it('searches by the national number without the country code', async () => {
    const spy = mockSearch(() => []);
    await sallaCustomers.createCustomer({ auth, input: { firstName: 'Ali', lastName: 'Saleh', mobile: '0501234567', countryCode: 'SA' } });
    const searches = spy.mock.calls.map(([request]) => request).filter((request) => request.method === HttpMethod.GET);
    expect(searches.map((request) => [pathOf(request), paramsOf(request).get('keyword')])).toEqual([['/customers', '501234567']]);
  });
});

describe('updateCustomer', () => {
  it('PUTs only the given fields to /customers/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 7, email: 'new@example.com' } }));
    const result = await sallaCustomers.updateCustomer({ auth, customerId: 7, input: { email: 'new@example.com', groupIds: [] } });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.PUT);
    expect(sent.url).toBe(`${BASE_URL}/customers/7`);
    expect(sent.body).toEqual({ email: 'new@example.com' });
    expect(result).toMatchObject({ id: 7, email: 'new@example.com' });
  });

  it('refuses an empty update or a bad ID without calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaCustomers.updateCustomer({ auth, customerId: 7, input: {} })).rejects.toThrow('Nothing to update');
    await expect(sallaCustomers.updateCustomer({ auth, customerId: 'x', input: { firstName: 'A' } })).rejects.toThrow('Customer ID must be a numeric');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('listCustomers', () => {
  it('sends keyword and dates, 60 per page, and adds the flat keys', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [{ id: 1, first_name: 'Ali' }, 'junk'], pagination: onePage }));
    const result = await sallaCustomers.listCustomers({
      auth,
      filters: { maxResults: 10, keyword: ' 0501 ', dateFrom: '2026-01-01', dateTo: '2026-02-01' },
    });
    const params = paramsOf(spy.mock.calls[0][0]);
    expect(pathOf(spy.mock.calls[0][0])).toBe('/customers');
    expect(params.get('keyword')).toBe('0501');
    expect(params.get('date_from')).toBe('2026-01-01');
    expect(params.get('date_to')).toBe('2026-02-01');
    expect(params.get('per_page')).toBe('60');
    expect(result.count).toBe(1);
    expect(result.truncated).toBe(false);
    expect(result.customers[0]).toMatchObject({ id: 1, full_name: 'Ali' });
  });
});

describe('addCustomersToGroup', () => {
  it('POSTs group_id and customers to /customers/groups/add_customers', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { message: 'Customers added' } }));
    const result = await sallaCustomers.addCustomersToGroup({ auth, groupId: '5', customerIds: ['1', '2', '2'] });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe(`${BASE_URL}/customers/groups/add_customers`);
    expect(sent.body).toEqual({ group_id: 5, customers: [1, 2] });
    expect(result).toEqual({ group_id: 5, customer_ids: [1, 2], count: 2, message: 'Customers added' });
  });

  it('reads the message from a string, a string list, or nothing', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce(ok({ data: ' Done ' }));
    spy.mockResolvedValueOnce(ok({ data: ['First', ' ', 'Second'] }));
    spy.mockResolvedValueOnce(ok({}));
    expect((await sallaCustomers.addCustomersToGroup({ auth, groupId: 5, customerIds: 1 })).message).toBe('Done');
    expect((await sallaCustomers.addCustomersToGroup({ auth, groupId: 5, customerIds: 1 })).message).toBe('First Second');
    expect((await sallaCustomers.addCustomersToGroup({ auth, groupId: 5, customerIds: 1 })).message).toBeNull();
  });

  it('does not call Salla without customers', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaCustomers.addCustomersToGroup({ auth, groupId: 5, customerIds: [] })).rejects.toThrow('Pick at least one customer');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('listCustomerGroups', () => {
  it('GETs /customers/groups and keeps id and name first', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: [{ id: 3, name: 'VIP', conditions: [] }, { id: 4 }, 'junk'], pagination: onePage }),
    );
    const result = await sallaCustomers.listCustomerGroups({ auth });
    const sent = spy.mock.calls[0][0];
    expect(pathOf(sent)).toBe('/customers/groups');
    expect(paramsOf(sent).get('per_page')).toBe('60');
    expect(result).toEqual({
      groups: [
        { id: 3, name: 'VIP', conditions: [] },
        { id: 4, name: null },
      ],
      count: 2,
      truncated: false,
    });
  });
});

describe('listWebhookEvents', () => {
  it('GETs /webhooks/events, drops duplicates and junk, and falls back to the event as label', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({
        data: [
          { id: 1, event: 'order.created', label: 'Order Created' },
          { id: 2, event: 'order.created', label: 'Duplicate' },
          { event: ' customer.created ', label: ' ' },
          { id: 3, event: '' },
          { id: 4, label: 'No event' },
          'junk',
          { id: '5', event: 'review.added', label: 7 },
        ],
      }),
    );
    const events = await sallaWebhooks.listWebhookEvents({ auth });
    expect(spy.mock.calls[0][0].method).toBe(HttpMethod.GET);
    expect(spy.mock.calls[0][0].url).toBe(`${BASE_URL}/webhooks/events`);
    expect(events).toEqual([
      { event: 'order.created', label: 'Order Created', id: 1 },
      { event: 'customer.created', label: 'customer.created', id: null },
      { event: 'review.added', label: 'review.added', id: '5' },
    ]);
  });

  it('returns an empty list when data is not an array', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { event: 'order.created' } }));
    expect(await sallaWebhooks.listWebhookEvents({ auth })).toEqual([]);
  });
});

describe('customerGroupOptions dropdown', () => {
  it('asks to connect first without calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    expect(await sallaProps.customerGroupOptions({ auth: undefined })).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Connect your Salla account first.',
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('labels groups by name, or by ID when the name is empty', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: [{ id: 3, name: ' VIP ' }, { id: 4, name: '' }, { name: 'No ID' }], pagination: onePage }),
    );
    expect(await sallaProps.customerGroupOptions({ auth })).toEqual({
      disabled: false,
      options: [
        { label: 'VIP', value: '3' },
        { label: 'Group 4', value: '4' },
      ],
      placeholder: undefined,
    });
    expect(pathOf(spy.mock.calls[0][0])).toBe('/customers/groups');
  });

  it('explains an empty list and a failed load', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [] }));
    expect((await sallaProps.customerGroupOptions({ auth })).placeholder).toBe(
      'No customer groups found. Create one in Salla under Customers > Customer Groups.',
    );
    vi.restoreAllMocks();
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 401, responseBody: { error: { message: 'Unauthorized' } } }));
    const failed = await sallaProps.customerGroupOptions({ auth });
    expect(failed.disabled).toBe(true);
    expect(failed.placeholder).toContain('Could not load options: Salla rejected the access token');
  });
});

describe('webhookEventOptions dropdown', () => {
  it('asks to connect first without calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    expect(await sallaProps.webhookEventOptions({ auth: undefined })).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Connect your Salla account first.',
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('labels events as "Label (event)", or the bare event when there is no label', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: [{ id: 1, event: 'order.created', label: 'Order Created' }, { id: 2, event: 'abandoned.cart' }] }),
    );
    expect(await sallaProps.webhookEventOptions({ auth })).toEqual({
      disabled: false,
      options: [
        { label: 'Order Created (order.created)', value: 'order.created' },
        { label: 'abandoned.cart', value: 'abandoned.cart' },
      ],
      placeholder: undefined,
    });
  });

  it('explains an empty list and a failed load', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [] }));
    expect((await sallaProps.webhookEventOptions({ auth })).placeholder).toContain('Salla returned no webhook events');
    vi.restoreAllMocks();
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    expect(await sallaProps.webhookEventOptions({ auth })).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Could not load options from Salla. Check the connection and try again.',
    });
  });
});
