import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { conversationIdDropdown, customerIdDropdown } from '../src/lib/common/props';
import { aiUpdateCustomerProperties } from '../src/lib/actions/ai/update-customer-properties';

const auth = { access_token: 'token' };
async function call({ dropdown, searchValue }: { dropdown: { options: unknown }; searchValue?: string }): Promise<{ options?: unknown; placeholder?: unknown }> {
  if (typeof dropdown.options !== 'function') {
    throw new Error('dropdown has no options loader');
  }
  const result: unknown = await Reflect.apply(dropdown.options, dropdown, [{ auth }, { searchValue }]);
  if (typeof result !== 'object' || result === null) {
    throw new Error('expected a dropdown state');
  }
  return { options: Reflect.get(result, 'options'), placeholder: Reflect.get(result, 'placeholder') };
}

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
    const result = await call({ dropdown: conversationIdDropdown, searchValue: 'refund "late"' });
    const request = spy.mock.calls[0][0];
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
    await call({ dropdown: customerIdDropdown, searchValue: 'a@b.co' });
    expect(spy.mock.calls[0][0].queryParams?.['query']).toBe('a@b.co');
  });
  it('omits query when not searching', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { _embedded: { customers: [] }, page: { totalPages: 1 } },
    });
    await call({ dropdown: customerIdDropdown });
    expect(spy.mock.calls[0][0].queryParams?.['query']).toBeUndefined();
  });
  it('stops the unsearched conversation list after two pages', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => ({
      status: 200,
      headers: {},
      body: { _embedded: { conversations: Array.from({ length: 50 }, (_, i) => ({ id: i + 1, subject: 'S' })) }, page: { totalPages: 10 } },
    }));
    const result = await call({ dropdown: conversationIdDropdown });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.placeholder).toBe('Showing the newest 100 - type to search for older records.');
  });
});

describe('ai_update_customer_properties', () => {
  it('returns success alongside the other fields', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 204, headers: {}, body: undefined });
    const run: unknown = aiUpdateCustomerProperties.run;
    if (typeof run !== 'function') throw new Error('action has no run');
    const result: unknown = await Reflect.apply(run, aiUpdateCustomerProperties, [{ auth, propsValue: { customerId: 5, properties: { plan: 'Pro' } } }]);
    expect(result).toEqual({ success: true, customerId: '5', updated: ['plan'] });
  });
});
