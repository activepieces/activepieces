import { beforeEach, describe, expect, it, vi } from 'vitest';

const searchAll = vi.fn<() => Promise<unknown>>();
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
const { aggregateStatus, userListOptions } = await import('../../../src/lib/common/customer-match-action');

const AUTH = { access_token: 'ya29.test-token' };
const AUTH_WITH_MANAGER = { access_token: 'ya29.test-token', props: { loginCustomerId: '999-888-7777' } };
const LIST = 'customers/1234567890/userLists/5';
const DESTINATION = { operatingAccount: { accountType: 'GOOGLE_ADS', accountId: '1234567890' }, productDestinationId: '5' };

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
});

describe('customer match actions', () => {
  beforeEach(() => {
    vi.useRealTimers();
    ingestAudienceMembers.mockReset().mockResolvedValue({ requestId: 'req-1' });
    removeAudienceMembers.mockReset().mockResolvedValue({ requestId: 'req-2' });
    retrieveRequestStatus.mockReset();
    search.mockReset();
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
      requests: 1,
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

  it('should carry the manager as login account and send removals without consent or terms', async () => {
    const output = await removeCustomerMatchData.run(
      actionContext({ customerId: '1234567890', userList: '5', members: [{ email: 'a@x.com' }], adUserData: 'GRANTED', adPersonalization: 'GRANTED' }, AUTH_WITH_MANAGER)
    );

    expect(removeAudienceMembers).toHaveBeenCalledTimes(1);
    const [{ body }] = removeAudienceMembers.mock.calls[0] as unknown as [{ body: Record<string, unknown> }];
    expect(body).toEqual({
      destinations: [{ ...DESTINATION, loginAccount: { accountType: 'GOOGLE_ADS', accountId: '9998887777' } }],
      audienceMembers: [{ userData: { userIdentifiers: [expect.objectContaining({ emailAddress: expect.any(String) })] } }],
      encoding: 'HEX',
    });
    expect(output).toMatchObject({ mode: 'remove', requestIds: ['req-2'], userListId: '5', status: 'PROCESSING' });
  });

  it('should fail before touching Google when no member has an identifier', async () => {
    await expect(
      addCustomerMatchData.run(
        actionContext({ customerId: '1234567890', userList: LIST, members: [{}], adUserData: 'GRANTED', adPersonalization: 'GRANTED', acceptTerms: true })
      )
    ).rejects.toThrow('has no identifier');
    expect(ingestAudienceMembers).not.toHaveBeenCalled();
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
    expect(retrieveRequestStatus).toHaveBeenCalledWith({ auth: AUTH, requestId: 'req-1' });
    expect(output).toMatchObject({
      status: 'PARTIAL_SUCCESS',
      matchRateRange: 'MATCH_RATE_RANGE_41_TO_50',
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
    ingestAudienceMembers.mockReset();
    retrieveRequestStatus.mockReset();
    vi.useRealTimers();
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
      requests: 2,
      status: 'PARTIAL_SUCCESS',
      errors: [{ recordCount: '1', reason: 'INVALID_IDENTIFIER' }],
      warnings: [{ recordCount: '2', reason: 'DUPLICATE_RECORD' }],
    });
  });
});

describe('userListOptions()', () => {
  beforeEach(() => {
    search.mockReset();
  });

  it('should ask for a connection, then for a customer, without calling Google', async () => {
    expect(await userListOptions({ auth: undefined, customerId: '1' })).toMatchObject({ disabled: true, placeholder: 'Please select an existing or create a new connection.' });
    expect(await userListOptions({ auth: AUTH, customerId: undefined })).toMatchObject({ disabled: true, placeholder: 'Please select a customer.' });
    expect(search).not.toHaveBeenCalled();
  });

  it('should list CRM-based lists with their upload key type', async () => {
    search.mockResolvedValue({
      results: [{ userList: { resourceName: LIST, id: '5', name: 'Newsletter', crmBasedUserList: { uploadKeyType: 'CONTACT_INFO' } } }],
    });

    const state = await userListOptions({ auth: AUTH, customerId: '1234567890' });

    expect(search).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: expect.stringContaining("WHERE user_list.type = 'CRM_BASED'") });
    expect(state).toEqual({ disabled: false, options: [{ label: 'Newsletter (CONTACT_INFO)', value: LIST }] });
  });

  it('should explain when there is no CRM-based list', async () => {
    search.mockResolvedValue({ results: [] });

    expect(await userListOptions({ auth: AUTH, customerId: '1234567890' })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('No CRM-based audience list') });
  });

  it('should surface the API error when listing fails', async () => {
    search.mockRejectedValue(new Error('boom'));

    expect(await userListOptions({ auth: AUTH, customerId: '1234567890' })).toMatchObject({ disabled: true, placeholder: 'An error occurred while listing the audience lists: boom' });
  });
});
