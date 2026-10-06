import { beforeEach, describe, expect, it, vi } from 'vitest';

const searchAll = vi.fn<(params: { maxRows: number }) => Promise<unknown>>();
const search = vi.fn<() => Promise<unknown>>();
const ingestAudienceMembers = vi.fn<() => Promise<unknown>>();
const removeAudienceMembers = vi.fn<() => Promise<unknown>>();
const retrieveRequestStatus = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { searchAll, search } };
});

vi.mock('../../../src/lib/common/data-manager', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/data-manager')>();
  return { ...actual, DataManagerApi: { ingestAudienceMembers, removeAudienceMembers, retrieveRequestStatus } };
});

const { retrieveReport } = await import('../../../src/lib/actions/retrieve-report');
const { addCustomerMatchData } = await import('../../../src/lib/actions/add-customer-match-data');
const { removeCustomerMatchData } = await import('../../../src/lib/actions/remove-customer-match-data');
const { aggregateStatus } = await import('../../../src/lib/common/customer-match-action');

const AUTH = { access_token: 'ya29.test-token' };
const AUTH_WITH_MANAGER = { access_token: 'ya29.test-token', props: { loginCustomerId: '999-888-7777' } };
const LIST = 'customers/1234567890/userLists/5';
const DESTINATION = { operatingAccount: { accountType: 'GOOGLE_ADS', accountId: '1234567890' }, productDestinationId: '5' };

const CONTACT_INFO_PAGE = { results: [{ userList: { resourceName: LIST, type: 'CRM_BASED', crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } } }] };

function actionContext(propsValue: Record<string, unknown>, auth: unknown = AUTH) {
  return { auth, propsValue } as never;
}

describe('retrieveReport', () => {
  beforeEach(() => {
    searchAll.mockReset();
  });

  it('should build the GAQL from the builder fields and flatten the rows', async () => {
    searchAll.mockResolvedValue({
      results: [{ campaign: { id: '1', name: 'A' }, metrics: { clicks: '5' } }],
      truncated: false,
    });

    const output = await retrieveReport.run(
      actionContext({ customerId: '1234567890', resource: 'campaign', dateRange: 'LAST_7_DAYS', metrics: ['metrics.clicks'], maxRows: 10 })
    );

    expect(searchAll).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      query: 'SELECT campaign.id, campaign.name, campaign.status, metrics.clicks FROM campaign WHERE segments.date DURING LAST_7_DAYS',
      maxRows: 10,
    });
    expect(output).toEqual({
      query: 'SELECT campaign.id, campaign.name, campaign.status, metrics.clicks FROM campaign WHERE segments.date DURING LAST_7_DAYS',
      rows: [{ 'campaign.id': '1', 'campaign.name': 'A', 'metrics.clicks': '5' }],
      count: 1,
      truncated: false,
    });
  });

  it('should run a raw query as-is when given', async () => {
    searchAll.mockResolvedValue({ results: [], truncated: false });

    await retrieveReport.run(
      actionContext({ customerId: '1234567890', resource: 'campaign', dateRange: 'TODAY', query: ' SELECT metrics.clicks FROM customer ' })
    );

    expect(searchAll).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT metrics.clicks FROM customer', maxRows: 1000 });
  });

  it.each([
    [1.5, 1],
    [0.4, 1],
    [2.9, 2],
    [250_000.5, 100_000],
  ])('should treat a Max Rows of %s as %i and report the rest as truncated', async (maxRows, expected) => {
    const rows = [{ metrics: { clicks: '1' } }, { metrics: { clicks: '2' } }, { metrics: { clicks: '3' } }];
    searchAll.mockImplementation(async (params: { maxRows: number }) => ({ results: rows.slice(0, params.maxRows), truncated: rows.length > params.maxRows }));

    const output = await retrieveReport.run(actionContext({ customerId: '1234567890', resource: 'campaign', dateRange: 'TODAY', query: 'SELECT metrics.clicks FROM customer', maxRows }));

    expect(searchAll).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT metrics.clicks FROM customer', maxRows: expected });
    expect(output).toMatchObject({ count: Math.min(expected, rows.length), truncated: rows.length > expected });
  });
});

describe('customer match actions', () => {
  beforeEach(() => {
    vi.useRealTimers();
    ingestAudienceMembers.mockReset().mockResolvedValue({ requestId: 'req-1' });
    removeAudienceMembers.mockReset().mockResolvedValue({ requestId: 'req-2' });
    retrieveRequestStatus.mockReset();
    search.mockReset().mockResolvedValue(CONTACT_INFO_PAGE);
  });

  it('should ingest hashed members with consent, terms of service and hex encoding', async () => {
    const output = await addCustomerMatchData.run(
      actionContext({
        customerId: '123-456-7890',
        userList: LIST,
        members: [{ email: 'a@x.com' }, { phone: '+5511999999999' }],
        adUserData: 'GRANTED',
        adPersonalization: 'DENIED',
        acceptTerms: true,
      })
    );

    expect(ingestAudienceMembers).toHaveBeenCalledTimes(1);
    const [{ auth, body }] = ingestAudienceMembers.mock.calls[0] as unknown as [{ auth: unknown; body: Record<string, unknown> }];
    expect(auth).toBe(AUTH);
    expect(body).toMatchObject({
      destinations: [DESTINATION],
      consent: { adUserData: 'CONSENT_GRANTED', adPersonalization: 'CONSENT_DENIED' },
      encoding: 'HEX',
      termsOfService: { customerMatchTermsOfServiceStatus: 'ACCEPTED' },
    });
    const members = body['audienceMembers'] as { userData: { userIdentifiers: Record<string, string>[] } }[];
    expect(members).toHaveLength(2);
    expect(members[0]?.userData.userIdentifiers[0]).toHaveProperty('emailAddress');
    expect(members[1]?.userData.userIdentifiers[0]).toHaveProperty('phoneNumber');
    expect(retrieveRequestStatus).not.toHaveBeenCalled();
    expect(output).toEqual({
      requestIds: ['req-1'],
      userList: LIST,
      userListId: '5',
      mode: 'add',
      members: 2,
      identifiers: 2,
      requests: [{ requestId: 'req-1', status: 'PROCESSING' }],
      status: 'PROCESSING',
      errors: [],
      warnings: [],
      fieldWarnings: [],
    });
  });

  it('should refuse to upload when the terms of service were not accepted', async () => {
    await expect(
      addCustomerMatchData.run(
        actionContext({ customerId: '1234567890', userList: LIST, members: [{ email: 'a@x.com' }], adUserData: 'GRANTED', adPersonalization: 'GRANTED', acceptTerms: false })
      )
    ).rejects.toThrow('terms of service');
    expect(ingestAudienceMembers).not.toHaveBeenCalled();
  });

  it('should make the author choose both consent values with no preselected answer', () => {
    for (const prop of [addCustomerMatchData.props.adUserData, addCustomerMatchData.props.adPersonalization]) {
      expect(prop.required).toBe(true);
      expect(prop.defaultValue).toBeUndefined();
      expect(prop.options.options.map((option) => option.value)).toEqual(['GRANTED', 'DENIED', 'UNSPECIFIED']);
    }
  });

  it('should carry the manager as login account, offer no consent props and send removals without consent or terms', async () => {
    const output = await removeCustomerMatchData.run(
      actionContext({ customerId: '1234567890', userList: '5', members: [{ email: 'a@x.com' }] }, AUTH_WITH_MANAGER)
    );

    expect(removeAudienceMembers).toHaveBeenCalledTimes(1);
    const [{ body }] = removeAudienceMembers.mock.calls[0] as unknown as [{ body: Record<string, unknown> }];
    expect(body).toEqual({
      destinations: [{ ...DESTINATION, loginAccount: { accountType: 'GOOGLE_ADS', accountId: '9998887777' } }],
      audienceMembers: [{ userData: { userIdentifiers: [expect.objectContaining({ emailAddress: expect.any(String) })] } }],
      encoding: 'HEX',
    });
    expect(output).toMatchObject({ mode: 'remove', requestIds: ['req-2'], userListId: '5', status: 'PROCESSING' });
    expect(output).not.toHaveProperty('matchRateRange');
    expect(Object.keys(removeCustomerMatchData.props)).toEqual(['customerId', 'userList', 'members', 'waitForCompletion']);
    expect(Object.keys(addCustomerMatchData.props)).toEqual(['customerId', 'userList', 'members', 'adUserData', 'adPersonalization', 'acceptTerms', 'waitForCompletion']);
  });

  it('should fail before touching Google when no member has an identifier', async () => {
    await expect(
      addCustomerMatchData.run(
        actionContext({ customerId: '1234567890', userList: LIST, members: [{}], adUserData: 'GRANTED', adPersonalization: 'GRANTED', acceptTerms: true })
      )
    ).rejects.toThrow('has no identifier');
    expect(ingestAudienceMembers).not.toHaveBeenCalled();
  });

  it('should refuse an audience list that does not take contact info before sending any member', async () => {
    search.mockResolvedValueOnce({ results: [{ userList: { resourceName: LIST, type: 'CRM_BASED', crmBasedUserList: { uploadKeyType: 'CRM_ID' } } }] });

    await expect(removeCustomerMatchData.run(actionContext({ customerId: '1234567890', userList: LIST, members: [{ email: 'a@x.com' }] }))).rejects.toThrow(
      'Audience list customers/1234567890/userLists/5 expects CRM_ID identifiers, but this action only sends contact information (e-mail, phone, address).'
    );
    expect(search).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      query:
        "SELECT user_list.resource_name, user_list.type, user_list.crm_based_user_list.upload_key_type FROM user_list WHERE user_list.resource_name = 'customers/1234567890/userLists/5' LIMIT 1",
    });
    expect(removeAudienceMembers).not.toHaveBeenCalled();
  });

  it('should poll the request status when asked to wait and report errors, warnings and match rate', async () => {
    vi.useFakeTimers();
    retrieveRequestStatus
      .mockResolvedValueOnce({ requestStatusPerDestination: [{ requestStatus: 'PROCESSING' }] })
      .mockResolvedValueOnce({
        requestStatusPerDestination: [
          {
            requestStatus: 'PARTIAL_SUCCESS',
            errorInfo: { errorCounts: [{ recordCount: '1', reason: 'INVALID_IDENTIFIER' }] },
            warningInfo: { warningCounts: [{ recordCount: '2', reason: 'DUPLICATE_RECORD' }] },
            audienceMembersIngestionStatus: { userDataIngestionStatus: { recordCount: '3', userIdentifierCount: '3', uploadMatchRateRange: 'MATCH_RATE_RANGE_41_TO_50' } },
          },
        ],
      });

    const promise = addCustomerMatchData.run(
      actionContext({
        customerId: '1234567890',
        userList: LIST,
        members: [{ email: 'a@x.com' }],
        adUserData: 'GRANTED',
        adPersonalization: 'GRANTED',
        acceptTerms: true,
        waitForCompletion: true,
      })
    );
    await vi.advanceTimersByTimeAsync(25_000);
    const output = await promise;

    expect(retrieveRequestStatus).toHaveBeenCalledTimes(2);
    expect(retrieveRequestStatus).toHaveBeenCalledWith({ auth: AUTH, requestId: 'req-1', timeoutMs: 110_000 });
    expect(output).toMatchObject({
      status: 'PARTIAL_SUCCESS',
      requests: [{ requestId: 'req-1', status: 'PARTIAL_SUCCESS', matchRateRange: 'MATCH_RATE_RANGE_41_TO_50' }],
      errors: [{ recordCount: '1', reason: 'INVALID_IDENTIFIER' }],
      warnings: [{ recordCount: '2', reason: 'DUPLICATE_RECORD' }],
    });
  });
});

describe('aggregateStatus()', () => {
  it('should stay PROCESSING until every request is final, then combine the results', () => {
    expect(aggregateStatus([])).toBe('PROCESSING');
    expect(aggregateStatus(['SUCCESS', 'PROCESSING'])).toBe('PROCESSING');
    expect(aggregateStatus(['FAILED', 'PROCESSING'])).toBe('PROCESSING');
    expect(aggregateStatus(['SUCCESS', 'SUCCESS'])).toBe('SUCCESS');
    expect(aggregateStatus(['FAILED', 'FAILED'])).toBe('FAILED');
    expect(aggregateStatus(['SUCCESS', 'PARTIAL_SUCCESS'])).toBe('PARTIAL_SUCCESS');
    expect(aggregateStatus(['SUCCESS', 'FAILED'])).toBe('PARTIAL_SUCCESS');
    expect(aggregateStatus(['PARTIAL_SUCCESS', 'FAILED'])).toBe('PARTIAL_SUCCESS');
  });
});

describe('waiting for a multi-request upload', () => {
  beforeEach(() => {
    search.mockReset().mockResolvedValue(CONTACT_INFO_PAGE);
    ingestAudienceMembers.mockReset();
    retrieveRequestStatus.mockReset();
    vi.useRealTimers();
  });

  it('should report the match rate of each request next to its own status instead of one value for the whole upload', async () => {
    vi.useFakeTimers();
    const members = Array.from({ length: 10_001 }, (_, i) => ({ email: `user${i}@x.com` }));
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockResolvedValueOnce({ requestId: 'req-b' });
    retrieveRequestStatus.mockImplementation(async ({ requestId }: { requestId: string }) => ({
      requestStatusPerDestination: [
        {
          requestStatus: 'SUCCESS',
          audienceMembersIngestionStatus: {
            userDataIngestionStatus: { uploadMatchRateRange: requestId === 'req-a' ? 'MATCH_RATE_RANGE_81_TO_90' : 'MATCH_RATE_RANGE_0' },
          },
        },
      ],
    }));

    const promise = addCustomerMatchData.run(
      actionContext({ customerId: '1234567890', userList: LIST, members, adUserData: 'GRANTED', adPersonalization: 'GRANTED', acceptTerms: true, waitForCompletion: true })
    );
    await vi.advanceTimersByTimeAsync(15_000);
    const output = await promise;

    expect(output).toMatchObject({
      status: 'SUCCESS',
      requests: [
        { requestId: 'req-a', status: 'SUCCESS', matchRateRange: 'MATCH_RATE_RANGE_81_TO_90' },
        { requestId: 'req-b', status: 'SUCCESS', matchRateRange: 'MATCH_RATE_RANGE_0' },
      ],
    });
    expect(output).not.toHaveProperty('matchRateRange');
  });

  it('should keep polling while any request is still processing, even after another one failed', async () => {
    vi.useFakeTimers();
    const members = Array.from({ length: 10_001 }, (_, i) => ({ email: `user${i}@x.com` }));
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockResolvedValueOnce({ requestId: 'req-b' });
    retrieveRequestStatus.mockImplementation(async ({ requestId }: { requestId: string }) => {
      const calls = retrieveRequestStatus.mock.calls.length;
      if (requestId === 'req-a') {
        return { requestStatusPerDestination: [{ requestStatus: 'FAILED', errorInfo: { errorCounts: [{ recordCount: '1', reason: 'INVALID_IDENTIFIER' }] } }] };
      }
      return { requestStatusPerDestination: [{ requestStatus: calls <= 2 ? 'PROCESSING' : 'SUCCESS', warningInfo: { warningCounts: [{ recordCount: '2', reason: 'DUPLICATE_RECORD' }] } }] };
    });

    const promise = addCustomerMatchData.run(
      actionContext({
        customerId: '1234567890',
        userList: LIST,
        members,
        adUserData: 'GRANTED',
        adPersonalization: 'GRANTED',
        acceptTerms: true,
        waitForCompletion: true,
      })
    );
    await vi.advanceTimersByTimeAsync(25_000);
    const output = await promise;

    expect(retrieveRequestStatus).toHaveBeenCalledTimes(4);
    expect(output).toMatchObject({
      requests: [
        { requestId: 'req-a', status: 'FAILED' },
        { requestId: 'req-b', status: 'SUCCESS' },
      ],
      status: 'PARTIAL_SUCCESS',
      errors: [{ recordCount: '1', reason: 'INVALID_IDENTIFIER' }],
      warnings: [{ recordCount: '2', reason: 'DUPLICATE_RECORD' }],
    });
  });

  it('should report PROCESSING when a request still has no status when the two minute deadline passes', async () => {
    vi.useFakeTimers();
    const members = Array.from({ length: 10_001 }, (_, i) => ({ email: `user${i}@x.com` }));
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockResolvedValueOnce({ requestId: 'req-b' });
    retrieveRequestStatus.mockImplementation(async ({ requestId }: { requestId: string }) =>
      requestId === 'req-a' ? { requestStatusPerDestination: [{ requestStatus: 'SUCCESS' }] } : {}
    );

    const promise = addCustomerMatchData.run(
      actionContext({
        customerId: '1234567890',
        userList: LIST,
        members,
        adUserData: 'GRANTED',
        adPersonalization: 'GRANTED',
        acceptTerms: true,
        waitForCompletion: true,
      })
    );
    await vi.advanceTimersByTimeAsync(130_000);
    const output = await promise;

    expect(retrieveRequestStatus).toHaveBeenCalledTimes(22);
    expect(output).toMatchObject({ requestIds: ['req-a', 'req-b'], status: 'PROCESSING' });
  });

  it('should stop at the two minute deadline when status calls are slow and return the accepted request ids as PROCESSING', async () => {
    vi.useFakeTimers();
    const members = Array.from({ length: 10_001 }, (_, i) => ({ email: `user${i}@x.com` }));
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockResolvedValueOnce({ requestId: 'req-b' });
    retrieveRequestStatus.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ requestStatusPerDestination: [{ requestStatus: 'PROCESSING' }] }), 70_000))
    );
    let settled = false;

    const promise = addCustomerMatchData
      .run(actionContext({ customerId: '1234567890', userList: LIST, members, adUserData: 'GRANTED', adPersonalization: 'GRANTED', acceptTerms: true, waitForCompletion: true }))
      .finally(() => {
        settled = true;
      });
    await vi.advanceTimersByTimeAsync(119_000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1_000);
    const output = await promise;

    expect(settled).toBe(true);
    expect(retrieveRequestStatus).toHaveBeenCalledTimes(4);
    expect(retrieveRequestStatus).toHaveBeenNthCalledWith(1, { auth: AUTH, requestId: 'req-a', timeoutMs: 110_000 });
    expect(retrieveRequestStatus).toHaveBeenNthCalledWith(3, { auth: AUTH, requestId: 'req-a', timeoutMs: 30_000 });
    expect(output).toMatchObject({
      requestIds: ['req-a', 'req-b'],
      status: 'PROCESSING',
      requests: [
        { requestId: 'req-a', status: 'PROCESSING' },
        { requestId: 'req-b', status: 'PROCESSING' },
      ],
    });
  });

  it('should return PROCESSING instead of failing when a status call never answers before the deadline', async () => {
    vi.useFakeTimers();
    const members = Array.from({ length: 10_001 }, (_, i) => ({ email: `user${i}@x.com` }));
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockResolvedValueOnce({ requestId: 'req-b' });
    retrieveRequestStatus.mockImplementation(
      ({ timeoutMs }: { timeoutMs: number }) => new Promise((_, reject) => setTimeout(() => reject(new Error('Data Manager API did not answer within 110 seconds.')), timeoutMs))
    );

    const promise = addCustomerMatchData.run(
      actionContext({ customerId: '1234567890', userList: LIST, members, adUserData: 'GRANTED', adPersonalization: 'GRANTED', acceptTerms: true, waitForCompletion: true })
    );
    await vi.advanceTimersByTimeAsync(120_000);
    const output = await promise;

    expect(retrieveRequestStatus).toHaveBeenCalledTimes(2);
    expect(output).toMatchObject({ requestIds: ['req-a', 'req-b'], status: 'PROCESSING', requests: [{ status: 'PROCESSING' }, { status: 'PROCESSING' }] });
  });

  it('should name the accepted request ids when checking their status fails', async () => {
    vi.useFakeTimers();
    const members = Array.from({ length: 10_001 }, (_, i) => ({ email: `user${i}@x.com` }));
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockResolvedValueOnce({ requestId: 'req-b' });
    retrieveRequestStatus.mockRejectedValue(new Error('Data Manager API returned 503'));

    const promise = addCustomerMatchData.run(
      actionContext({
        customerId: '1234567890',
        userList: LIST,
        members,
        adUserData: 'GRANTED',
        adPersonalization: 'GRANTED',
        acceptTerms: true,
        waitForCompletion: true,
      })
    );
    const assertion = expect(promise).rejects.toThrow(
      'Google accepted requests req-a, req-b, but checking their status failed: Data Manager API returned 503. The upload itself went through and running this step again would send the members again; check each request with Custom API Call: method GET, URL https://datamanager.googleapis.com/v1/requestStatus:retrieve?requestId=<request id> instead.'
    );
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
    expect(ingestAudienceMembers).toHaveBeenCalledTimes(2);
  });
});

describe('uploading in several batches', () => {
  const members = Array.from({ length: 10_001 }, (_, i) => ({ email: `user${i}@x.com` }));
  const props = { customerId: '1234567890', userList: LIST, members, adUserData: 'GRANTED', adPersonalization: 'GRANTED', acceptTerms: true };

  beforeEach(() => {
    search.mockReset().mockResolvedValue(CONTACT_INFO_PAGE);
    ingestAudienceMembers.mockReset();
    retrieveRequestStatus.mockReset();
    vi.useRealTimers();
  });

  it('should name the accepted request ids when a later batch fails', async () => {
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockRejectedValueOnce(new Error('socket hang up'));

    await expect(addCustomerMatchData.run(actionContext(props))).rejects.toThrow(
      'Batch 2 of 2 failed: socket hang up. Google already accepted requests req-a for the earlier batches; check each request with Custom API Call: method GET, URL https://datamanager.googleapis.com/v1/requestStatus:retrieve?requestId=<request id> before retrying, since a retry sends those batches again.'
    );
    expect(ingestAudienceMembers).toHaveBeenCalledTimes(2);
  });

  it('should name the accepted request ids when a later batch answer cannot be read', async () => {
    const unreadable =
      'Google accepted the request but its response could not be read (the body is not valid JSON); the change may have been applied. Check the audience list before retrying.';
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a' }).mockRejectedValueOnce(new Error(unreadable));

    const failure = await addCustomerMatchData.run(actionContext(props)).catch((error: unknown) => error);

    expect(failure).toMatchObject({
      message: expect.stringContaining(`Batch 2 of 2 failed: ${unreadable.slice(0, -1)}. Google already accepted requests req-a for the earlier batches;`),
    });
    expect(retrieveRequestStatus).not.toHaveBeenCalled();
  });

  it('should rethrow the original error when the first batch fails', async () => {
    const failure = new Error('PERMISSION_DENIED');
    ingestAudienceMembers.mockRejectedValueOnce(failure);

    await expect(addCustomerMatchData.run(actionContext(props))).rejects.toBe(failure);
    expect(ingestAudienceMembers).toHaveBeenCalledTimes(1);
  });

  it('should collect the submission warnings of every batch', async () => {
    const warning = { field: 'audience_members[0].user_data', reason: 'INVALID_FORMAT', description: 'Bad hash' };
    ingestAudienceMembers.mockResolvedValueOnce({ requestId: 'req-a', fieldWarnings: [warning] }).mockResolvedValueOnce({ requestId: 'req-b' });

    const output = await addCustomerMatchData.run(actionContext(props));

    expect(output).toMatchObject({
      requestIds: ['req-a', 'req-b'],
      requests: [
        { requestId: 'req-a', status: 'PROCESSING' },
        { requestId: 'req-b', status: 'PROCESSING' },
      ],
      fieldWarnings: [warning],
    });
  });
});
