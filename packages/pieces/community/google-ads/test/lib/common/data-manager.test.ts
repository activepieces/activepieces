import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { HttpError } = await import('@activepieces/pieces-common');
const { DATA_MANAGER_SCOPE, DataManagerApi, DataManagerApiError, destinationFor, userListIdFrom } = await import('../../../src/lib/common/data-manager');

const TOKEN = 'ya29.test-token';
const AUTH = { access_token: TOKEN };
const AUTH_WITH_MANAGER = { access_token: TOKEN, props: { loginCustomerId: '999-888-7777' } };
const BASE = 'https://datamanager.googleapis.com/v1';

function httpError(status: number, data: unknown): HttpError {
  return new HttpError({}, { status, responseBody: data });
}

describe('userListIdFrom()', () => {
  it('should accept a resource name or a bare id', () => {
    expect(userListIdFrom('customers/1234567890/userLists/55')).toBe('55');
    expect(userListIdFrom(' 55 ')).toBe('55');
  });

  it('should reject anything else', () => {
    expect(() => userListIdFrom('customers/1234567890/campaigns/1')).not.toThrow();
    expect(() => userListIdFrom('abc')).toThrow('not a user list id');
    expect(() => userListIdFrom('')).toThrow('not a user list id');
  });
});

describe('destinationFor()', () => {
  it('should target the account and numeric list, without a login account when connecting directly', () => {
    expect(destinationFor({ auth: AUTH, customerId: '123-456-7890', userList: 'customers/1234567890/userLists/55' })).toEqual({
      operatingAccount: { accountType: 'GOOGLE_ADS', accountId: '1234567890' },
      productDestinationId: '55',
    });
  });

  it('should carry the manager as login account when the connection has one', () => {
    expect(destinationFor({ auth: AUTH_WITH_MANAGER, customerId: '1234567890', userList: '55' })).toEqual({
      operatingAccount: { accountType: 'GOOGLE_ADS', accountId: '1234567890' },
      loginAccount: { accountType: 'GOOGLE_ADS', accountId: '9998887777' },
      productDestinationId: '55',
    });
  });
});

describe('DataManagerApi', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('should expose the scope the API needs', () => {
    expect(DATA_MANAGER_SCOPE).toBe('https://www.googleapis.com/auth/datamanager');
  });

  it('should POST audienceMembers:ingest with the bearer token and no Google Ads headers', async () => {
    sendRequest.mockResolvedValue({ body: { requestId: 'req-1' } });
    const body = {
      destinations: [destinationFor({ auth: AUTH, customerId: '1234567890', userList: '55' })],
      audienceMembers: [{ userData: { userIdentifiers: [{ emailAddress: 'ab' }] } }],
      encoding: 'HEX' as const,
      termsOfService: { customerMatchTermsOfServiceStatus: 'ACCEPTED' as const },
    };

    const answer = await DataManagerApi.ingestAudienceMembers({ auth: AUTH_WITH_MANAGER, body });

    expect(answer).toEqual({ requestId: 'req-1' });
    expect(sendRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/audienceMembers:ingest`,
      body,
      authentication: { type: 'BEARER_TOKEN', token: TOKEN },
    });
  });

  it('should POST audienceMembers:remove', async () => {
    sendRequest.mockResolvedValue({ body: { requestId: 'req-2' } });

    await DataManagerApi.removeAudienceMembers({
      auth: AUTH,
      body: {
        destinations: [destinationFor({ auth: AUTH, customerId: '1234567890', userList: '55' })],
        audienceMembers: [],
        encoding: 'HEX',
      },
    });

    expect(sendRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST', url: `${BASE}/audienceMembers:remove` }));
  });

  it('should GET requestStatus:retrieve with the request id as query param', async () => {
    sendRequest.mockResolvedValue({ body: { requestStatusPerDestination: [{ requestStatus: 'SUCCESS' }] } });

    const answer = await DataManagerApi.retrieveRequestStatus({ auth: AUTH, requestId: 'req-1' });

    expect(answer.requestStatusPerDestination?.[0]?.requestStatus).toBe('SUCCESS');
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: `${BASE}/requestStatus:retrieve`, queryParams: { requestId: 'req-1' } })
    );
  });

  it('should turn a google.rpc.Status answer into a readable DataManagerApiError', async () => {
    sendRequest.mockRejectedValue(
      httpError(400, {
        error: {
          code: 400,
          message: 'Request contains an invalid argument.',
          status: 'INVALID_ARGUMENT',
          details: [
            { '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [{ field: 'destinations[0].productDestinationId', description: 'Audience not found.' }] },
            { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'INVALID_DESTINATION', domain: 'datamanager.googleapis.com' },
          ],
        },
      })
    );

    const promise = DataManagerApi.retrieveRequestStatus({ auth: AUTH, requestId: 'x' });

    await expect(promise).rejects.toBeInstanceOf(DataManagerApiError);
    await expect(promise).rejects.toThrow(
      'Data Manager API returned 400 (INVALID_ARGUMENT): Request contains an invalid argument. [destinations[0].productDestinationId: Audience not found.; reason: INVALID_DESTINATION]'
    );
  });

  it('should keep the raw body when the answer is not a google.rpc.Status', async () => {
    sendRequest.mockRejectedValue(httpError(502, '<html>Bad gateway</html>'));

    await expect(DataManagerApi.retrieveRequestStatus({ auth: AUTH, requestId: 'x' })).rejects.toThrow('Data Manager API returned 502: <html>Bad gateway</html>');
  });
});
