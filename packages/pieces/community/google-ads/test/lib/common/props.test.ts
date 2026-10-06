import { beforeEach, describe, expect, it, vi } from 'vitest';

const listAccessibleCustomers = vi.fn<() => Promise<unknown>>();
const customerInfo = vi.fn<(params: { auth: unknown; customerId: string }) => Promise<unknown>>();
const listCustomerClients = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { listAccessibleCustomers, customerInfo, listCustomerClients } };
});

const { customerOptions } = await import('../../../src/lib/common/props');

const AUTH = { access_token: 'tok' };

describe('customerOptions()', () => {
  beforeEach(() => {
    listAccessibleCustomers.mockReset();
    customerInfo.mockReset();
    listCustomerClients.mockReset();
  });

  it('should list the hierarchy under the manager when the connection has a login customer id', async () => {
    listCustomerClients.mockResolvedValue({
      clients: [
        { id: '9998887777', descriptiveName: 'Agency', manager: true, testAccount: true },
        { id: '1111111111', descriptiveName: 'Client A', testAccount: true },
      ],
      truncated: false,
    });

    const state = await customerOptions({ access_token: 'tok', props: { loginCustomerId: '999-888-7777' } });

    expect(listCustomerClients).toHaveBeenCalledWith({ auth: { access_token: 'tok', props: { loginCustomerId: '999-888-7777' } }, managerId: '9998887777' });
    expect(listAccessibleCustomers).not.toHaveBeenCalled();
    expect(state).toEqual({
      disabled: false,
      options: [
        { label: 'Agency (manager, test) · 999-888-7777', value: '9998887777' },
        { label: 'Client A (test) · 111-111-1111', value: '1111111111' },
      ],
    });
  });

  it('should keep the listed accounts and tell the user to type the customer ID when the manager list is truncated', async () => {
    listCustomerClients.mockResolvedValue({
      clients: [
        { id: '1111111111', descriptiveName: 'Client A' },
        { id: '2222222222', descriptiveName: 'Client B' },
      ],
      truncated: true,
    });

    const state = await customerOptions({ access_token: 'tok', props: { loginCustomerId: '999-888-7777' } });

    expect(state).toEqual({
      disabled: false,
      options: [
        { label: 'Client A · 111-111-1111', value: '1111111111' },
        { label: 'Client B · 222-222-2222', value: '2222222222' },
      ],
      placeholder:
        'Showing the first 2 enabled accounts under the manager. If yours is not listed, enter its customer ID (e.g. 123-456-7890) as a custom value.',
    });
  });

  it('should leave the placeholder unset when the manager list is complete', async () => {
    listCustomerClients.mockResolvedValue({ clients: [{ id: '1111111111' }], truncated: false });

    const state = await customerOptions({ access_token: 'tok', props: { loginCustomerId: '999-888-7777' } });

    expect(state.placeholder).toBeUndefined();
  });

  it('should ask for a connection and make no request when there is no token', async () => {
    const state = await customerOptions(undefined);

    expect(state).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Please select an existing or create a new connection.',
    });
    expect(listAccessibleCustomers).not.toHaveBeenCalled();
  });

  it('should label accounts with their name and flags, falling back to the dashed id', async () => {
    listAccessibleCustomers.mockResolvedValue(['1111111111', '2222222222', '3333333333']);
    customerInfo
      .mockResolvedValueOnce({ id: '1111111111', descriptiveName: 'Acme Ads', manager: true })
      .mockRejectedValueOnce(new Error('no access'))
      .mockResolvedValueOnce({ id: '3333333333', descriptiveName: 'Sandbox', testAccount: true });

    const state = await customerOptions(AUTH);

    expect(state.disabled).toBe(false);
    expect(state.options).toHaveLength(3);
    expect(state.options).toEqual(
      expect.arrayContaining([
        { label: 'Acme Ads (manager) · 111-111-1111', value: '1111111111' },
        { label: '222-222-2222', value: '2222222222' },
        { label: 'Sandbox (test) · 333-333-3333', value: '3333333333' },
      ])
    );
  });

  it('should explain when the Google account has no customers', async () => {
    listAccessibleCustomers.mockResolvedValue([]);

    const state = await customerOptions(AUTH);

    expect(state).toEqual({
      disabled: true,
      options: [],
      placeholder: 'This Google account has no accessible Google Ads customers.',
    });
    expect(customerInfo).not.toHaveBeenCalled();
  });

  it('should degrade to a disabled dropdown when listing fails', async () => {
    listAccessibleCustomers.mockRejectedValue(new Error('boom'));

    const state = await customerOptions(AUTH);

    expect(state).toEqual({
      disabled: true,
      options: [],
      placeholder: 'An error occurred while listing the accessible Google Ads customers: boom',
    });
  });
});
