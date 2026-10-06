import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<(request: { body: { query: string; pageToken?: string } }) => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { userListOptions } = await import('../../../src/lib/common/customer-match-action');

const AUTH = { access_token: 'ya29.test-token' };
const LIST = 'customers/1234567890/userLists/5';

function listRows({ from, count }: { from: number; count: number }) {
  return Array.from({ length: count }, (_, i) => ({
    userList: { resourceName: `customers/1234567890/userLists/${from + i}`, id: String(from + i), name: `List ${from + i}`, crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } },
  }));
}

describe('userListOptions()', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('should ask for a connection, then for a customer, without calling Google', async () => {
    expect(await userListOptions({ auth: undefined, customerId: '1' })).toMatchObject({ disabled: true, placeholder: 'Please select an existing or create a new connection.' });
    expect(await userListOptions({ auth: AUTH, customerId: undefined })).toMatchObject({ disabled: true, placeholder: 'Please select a customer.' });
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('should list CRM-based lists with their upload key type', async () => {
    sendRequest.mockResolvedValueOnce({
      body: { results: [{ userList: { resourceName: LIST, id: '5', name: 'Newsletter', crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } } }] },
    });

    const state = await userListOptions({ auth: AUTH, customerId: '1234567890' });

    expect(sendRequest.mock.calls[0][0].body.query).toContain("WHERE user_list.type = 'CRM_BASED'");
    expect(state).toEqual({ disabled: false, options: [{ label: 'Newsletter (CONTACT_INFO)', value: LIST }] });
  });

  it('should follow every result page so lists after the first page show up', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { results: listRows({ from: 1, count: 3 }), nextPageToken: 'p2' } })
      .mockResolvedValueOnce({ body: { results: listRows({ from: 4, count: 2 }), nextPageToken: 'p3' } })
      .mockResolvedValueOnce({ body: { results: listRows({ from: 6, count: 1 }) } });

    const state = await userListOptions({ auth: AUTH, customerId: '1234567890' });

    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect(sendRequest.mock.calls.map(([request]) => request.body.pageToken)).toEqual([undefined, 'p2', 'p3']);
    expect(state).toEqual({
      disabled: false,
      options: Array.from({ length: 6 }, (_, i) => ({ label: `List ${i + 1} (CONTACT_INFO)`, value: `customers/1234567890/userLists/${i + 1}` })),
    });
  });

  it('should stop at 2,000 lists and say how to pick one that is not listed', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { results: listRows({ from: 1, count: 1_000 }), nextPageToken: 'p2' } })
      .mockResolvedValueOnce({ body: { results: listRows({ from: 1_001, count: 1_000 }), nextPageToken: 'p3' } })
      .mockResolvedValueOnce({ body: { results: listRows({ from: 2_001, count: 5 }) } });

    const state = await userListOptions({ auth: AUTH, customerId: '1234567890' });

    expect(state.options).toHaveLength(2_000);
    expect(state).toMatchObject({
      disabled: false,
      placeholder:
        'Showing the first 2000 CRM-based audience lists. If yours is not listed, enter its resource name (e.g. customers/1234567890/userLists/55) or numeric id as a custom value.',
    });
  });

  it('should explain when there is no CRM-based list', async () => {
    sendRequest.mockResolvedValueOnce({ body: { results: [] } });

    expect(await userListOptions({ auth: AUTH, customerId: '1234567890' })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('No CRM-based audience list') });
  });

  it('should surface the API error when listing fails', async () => {
    sendRequest.mockRejectedValueOnce(new Error('boom'));

    expect(await userListOptions({ auth: AUTH, customerId: '1234567890' })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('An error occurred while listing the audience lists') });
  });
});
