import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<(request: { body: { query: string; pageToken?: string } }) => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { uploadCustomerMatch, userListOptions } = await import('../../../src/lib/common/customer-match-action');

const AUTH = { access_token: 'ya29.test-token' };
const LIST = 'customers/1234567890/userLists/5';

const CONTACT_INFO_LIST = { userList: { resourceName: LIST, type: 'CRM_BASED', crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } } };

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

  it('should list only CRM-based lists that take contact info', async () => {
    sendRequest.mockResolvedValueOnce({
      body: { results: [{ userList: { resourceName: LIST, id: '5', name: 'Newsletter' } }] },
    });

    const state = await userListOptions({ auth: AUTH, customerId: '1234567890' });

    expect(sendRequest.mock.calls[0][0].body.query).toContain("WHERE user_list.type = 'CRM_BASED' AND user_list.crm_based_user_list.upload_key_type = 'CONTACT_INFO'");
    expect(state).toEqual({ disabled: false, options: [{ label: 'Newsletter', value: LIST }] });
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
      options: Array.from({ length: 6 }, (_, i) => ({ label: `List ${i + 1}`, value: `customers/1234567890/userLists/${i + 1}` })),
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
        'Showing the first 2000 CRM-based contact info audience lists. If yours is not listed, enter its resource name (e.g. customers/1234567890/userLists/55) or numeric id as a custom value.',
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

describe('uploadCustomerMatch() while waiting for processing', () => {
  const upload = () =>
    uploadCustomerMatch({
      auth: AUTH,
      customerId: '1234567890',
      userList: LIST,
      members: [{ email: 'a@x.com' }],
      waitForCompletion: true,
      mode: 'add',
      consent: { adUserData: 'GRANTED', adPersonalization: 'GRANTED' },
    });

  function stubFetch(answerStatus: (init: RequestInit) => Promise<Response>) {
    const fetchMock = vi.fn(async (_input: string | URL | Request, init: RequestInit = {}) =>
      init.method === 'POST' ? new Response(JSON.stringify({ requestId: 'req-1' }), { status: 200 }) : answerStatus(init)
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    sendRequest.mockReset().mockResolvedValue({ body: { results: [CONTACT_INFO_LIST] } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should keep waiting through a status call that stalls past the 60 second cap and return the request ids as PROCESSING at the deadline', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), ms);
      return controller.signal;
    });
    const started = Date.now();
    const statusCalls: number[] = [];
    stubFetch(
      (init) =>
        new Promise<Response>((_, reject) => {
          statusCalls.push(Date.now() - started);
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        })
    );
    let settled = false;

    const promise = upload().finally(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(75_000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(44_000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1_000);
    const output = await promise;

    expect(statusCalls).toEqual([10_000, 80_000]);
    expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([60_000, 60_000, 40_000]);
    expect(output).toMatchObject({ requestIds: ['req-1'], status: 'PROCESSING', requests: [{ requestId: 'req-1', status: 'PROCESSING' }] });
  });

  it('should keep polling after a network failure and report the final status', async () => {
    let calls = 0;
    stubFetch(async () => {
      calls += 1;
      if (calls === 1) {
        throw new TypeError('fetch failed');
      }
      return new Response(JSON.stringify({ requestStatusPerDestination: [{ requestStatus: 'SUCCESS' }] }), { status: 200 });
    });

    const promise = upload();
    await vi.advanceTimersByTimeAsync(25_000);
    const output = await promise;

    expect(calls).toBe(2);
    expect(output).toMatchObject({ requestIds: ['req-1'], status: 'SUCCESS' });
  });

  it('should still fail with the accepted request ids when Google rejects the status check', async () => {
    stubFetch(async () => new Response(JSON.stringify({ error: { code: 400, message: 'Unknown request id.', status: 'INVALID_ARGUMENT' } }), { status: 400 }));

    const assertion = expect(upload()).rejects.toThrow(
      'Google accepted requests req-1, but checking their status failed: Data Manager API returned 400 (INVALID_ARGUMENT): Unknown request id.. The upload itself went through'
    );
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });
});

describe('uploadCustomerMatch() audience list check', () => {
  const upload = (userList: string) =>
    uploadCustomerMatch({ auth: AUTH, customerId: '123-456-7890', userList, members: [{ email: 'a@x.com' }], waitForCompletion: false, mode: 'remove' });

  function stubFetch() {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ requestId: 'req-1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  beforeEach(() => {
    sendRequest.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should look up the chosen list and upload to a CRM-based contact info list', async () => {
    sendRequest.mockResolvedValueOnce({ body: { results: [CONTACT_INFO_LIST] } });
    const fetchMock = stubFetch();

    const output = await upload('5');

    expect(sendRequest.mock.calls[0][0].body.query).toBe(
      "SELECT user_list.resource_name, user_list.type, user_list.crm_based_user_list.upload_key_type FROM user_list WHERE user_list.resource_name = 'customers/1234567890/userLists/5' LIMIT 1"
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(output).toMatchObject({ requestIds: ['req-1'], userListId: '5' });
  });

  it.each([
    [{ userList: { resourceName: LIST, type: 'CRM_BASED', crmBasedUserList: { uploadKeyType: 'CRM_ID' } } }, 'expects CRM_ID identifiers, but this action only sends contact information'],
    [{ userList: { resourceName: LIST, type: 'CRM_BASED', crmBasedUserList: { uploadKeyType: 'MOBILE_ADVERTISING_ID' } } }, 'expects MOBILE_ADVERTISING_ID identifiers'],
    [{ userList: { resourceName: LIST, type: 'RULE_BASED' } }, 'is a RULE_BASED list. Customer Match uploads need a CRM-based list whose upload key type is CONTACT_INFO'],
  ])('should refuse a list the contact identifiers cannot fill before sending any member (%#)', async (row, message) => {
    sendRequest.mockResolvedValueOnce({ body: { results: [row] } });
    const fetchMock = stubFetch();

    await expect(upload(LIST)).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should refuse a list that does not exist in the selected customer before sending any member', async () => {
    sendRequest.mockResolvedValueOnce({ body: { results: [] } });
    const fetchMock = stubFetch();

    await expect(upload('77')).rejects.toThrow('Audience list customers/1234567890/userLists/77 was not found.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
