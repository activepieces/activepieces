import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { conversationIdDropdown, customerIdDropdown } from '../src/lib/common/props';
import { aiUpdateCustomerProperties } from '../src/lib/actions/ai/update-customer-properties';

const auth = { access_token: 'token' };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (dropdown: any, searchValue?: string) => dropdown.options({ auth }, { searchValue });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('searchable dropdowns', () => {
  it('sends the search text as the conversations query', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { _embedded: { conversations: [{ id: 9, subject: 'Old' }] }, page: { totalPages: 1 } },
    });
    const result = await call(conversationIdDropdown, 'refund "late"');
    const request = spy.mock.calls[0][0] as HttpRequest;
    expect(request.queryParams?.['query']).toBe('refund late');
    expect(request.queryParams?.['status']).toBe('all');
    expect(result.options).toEqual([{ label: 'Old', value: '9' }]);
    expect(result.placeholder).toBeUndefined();
  });
  it('sends the search text as the customers query', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { _embedded: { customers: [] }, page: { totalPages: 1 } },
    });
    await call(customerIdDropdown, 'a@b.co');
    expect((spy.mock.calls[0][0] as HttpRequest).queryParams?.['query']).toBe('a@b.co');
  });
  it('omits query when not searching', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { _embedded: { customers: [] }, page: { totalPages: 1 } },
    });
    await call(customerIdDropdown);
    expect((spy.mock.calls[0][0] as HttpRequest).queryParams?.['query']).toBeUndefined();
  });
});

describe('ai_update_customer_properties', () => {
  it('returns success alongside the other fields', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 204, headers: {}, body: undefined });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await aiUpdateCustomerProperties.run({ auth, propsValue: { customerId: 5, properties: { plan: 'Pro' } } } as any);
    expect(result).toEqual({ success: true, customerId: '5', updated: ['plan'] });
  });
});
