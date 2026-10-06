import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DATA_MANAGER_SCOPE, DataManagerApi, DataManagerApiError, destinationFor, userListIdFrom } from '../../../src/lib/common/data-manager';

const TOKEN = 'ya29.test-token';
const AUTH = { access_token: TOKEN };
const AUTH_WITH_MANAGER = { access_token: TOKEN, props: { loginCustomerId: '999-888-7777' } };
const BASE = 'https://datamanager.googleapis.com/v1';
const HASHED_EMAIL = 'f1d2d2f924e986ac86fdf7b36c94bcdf32beec15f1d2d2f924e986ac86fdf7b3';

const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();

function jsonResponse(status: number, data: unknown): Response {
  return new Response(typeof data === 'string' ? data : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url, init };
}

function ingestBody() {
  return {
    destinations: [destinationFor({ auth: AUTH, customerId: '1234567890', userList: '55' })],
    audienceMembers: [{ userData: { userIdentifiers: [{ emailAddress: HASHED_EMAIL }] } }],
    encoding: 'HEX' as const,
    termsOfService: { customerMatchTermsOfServiceStatus: 'ACCEPTED' as const },
  };
}

describe('userListIdFrom()', () => {
  it('should accept a bare numeric id', () => {
    expect(userListIdFrom({ userList: ' 55 ', customerId: '1234567890' })).toBe('55');
  });

  it('should accept a user list resource name of the selected customer, with or without dashes in the customer id', () => {
    expect(userListIdFrom({ userList: 'customers/1234567890/userLists/55', customerId: '1234567890' })).toBe('55');
    expect(userListIdFrom({ userList: ' customers/1234567890/userLists/55 ', customerId: '123-456-7890' })).toBe('55');
  });

  it('should reject a user list resource name of another customer', () => {
    expect(() => userListIdFrom({ userList: 'customers/1111111111/userLists/55', customerId: '123-456-7890' })).toThrow(
      'Audience list customers/1111111111/userLists/55 belongs to customer 1111111111, but the selected customer is 1234567890.'
    );
  });

  it.each([
    'customers/1234567890/campaigns/1',
    'customers/1234567890/adGroups/1',
    'customers/1234567890/userLists/abc',
    'customers/123-456-7890/userLists/55',
    'userLists/55',
    'customers/1234567890/userLists/55/extra',
    'abc',
    '',
  ])('should reject %j', (userList) => {
    expect(() => userListIdFrom({ userList, customerId: '1234567890' })).toThrow('is not a user list id or resource name');
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

  it('should refuse a user list of another customer instead of pairing its id with the selected customer', () => {
    expect(() => destinationFor({ auth: AUTH, customerId: '1234567890', userList: 'customers/1111111111/userLists/55' })).toThrow(
      'belongs to customer 1111111111'
    );
  });

  it('should refuse resources that are not user lists', () => {
    expect(() => destinationFor({ auth: AUTH, customerId: '1234567890', userList: 'customers/1234567890/campaigns/1' })).toThrow(
      'is not a user list id or resource name'
    );
  });
});

describe('DataManagerApi', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should expose the scope the API needs', () => {
    expect(DATA_MANAGER_SCOPE).toBe('https://www.googleapis.com/auth/datamanager');
  });

  it('should POST audienceMembers:ingest as JSON with the bearer token, a deadline and no Google Ads headers', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { requestId: 'req-1' }));
    const body = ingestBody();

    const answer = await DataManagerApi.ingestAudienceMembers({ auth: AUTH_WITH_MANAGER, body });

    expect(answer).toEqual({ requestId: 'req-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/audienceMembers:ingest`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, Accept: 'application/json', 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init.body))).toEqual(body);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('should keep only well-formed submission warnings', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { requestId: 'req-1', fieldWarnings: [{ field: 'a', reason: 'R', description: 'D' }, 'junk'] }));

    const answer = await DataManagerApi.ingestAudienceMembers({ auth: AUTH, body: ingestBody() });

    expect(answer).toEqual({ requestId: 'req-1', fieldWarnings: [{ field: 'a', reason: 'R', description: 'D' }] });
  });

  it('should POST audienceMembers:remove', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { requestId: 'req-2' }));

    const answer = await DataManagerApi.removeAudienceMembers({
      auth: AUTH,
      body: {
        destinations: [destinationFor({ auth: AUTH, customerId: '1234567890', userList: '55' })],
        audienceMembers: [],
        encoding: 'HEX',
      },
    });

    expect(answer).toEqual({ requestId: 'req-2' });
    expect(lastCall().url).toBe(`${BASE}/audienceMembers:remove`);
    expect(lastCall().init.method).toBe('POST');
  });

  it('should GET requestStatus:retrieve with the request id as query param and no body', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        requestStatusPerDestination: [
          {
            requestStatus: 'SUCCESS',
            warningInfo: { warningCounts: [{ recordCount: '2', reason: 'DUPLICATE_RECORD' }] },
            audienceMembersIngestionStatus: { userDataIngestionStatus: { recordCount: '3', uploadMatchRateRange: 'MATCH_RATE_RANGE_41_TO_50' } },
          },
        ],
      })
    );

    const answer = await DataManagerApi.retrieveRequestStatus({ auth: AUTH, requestId: 'req 1' });

    expect(answer.requestStatusPerDestination).toEqual([
      {
        requestStatus: 'SUCCESS',
        warningInfo: { warningCounts: [{ recordCount: '2', reason: 'DUPLICATE_RECORD' }] },
        audienceMembersIngestionStatus: { userDataIngestionStatus: { recordCount: '3', uploadMatchRateRange: 'MATCH_RATE_RANGE_41_TO_50' } },
      },
    ]);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/requestStatus:retrieve?requestId=req+1`);
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' });
  });

  it('should treat a status answer that is not an object as no status yet', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, '[1,2]'));

    await expect(DataManagerApi.retrieveRequestStatus({ auth: AUTH, requestId: 'x' })).resolves.toEqual({});
  });

  it('should turn a google.rpc.Status answer into a readable DataManagerApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
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

  it('should fall back to the HTTP status text when the answer is not a google.rpc.Status', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502, statusText: 'Bad Gateway' }));

    await expect(DataManagerApi.retrieveRequestStatus({ auth: AUTH, requestId: 'x' })).rejects.toThrow('Data Manager API returned 502: Bad Gateway');
  });

  it('should never expose the hashed members of a failed ingest in the error or the logs', async () => {
    const logged = (['error', 'warn', 'log', 'info', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
    fetchMock.mockResolvedValue(jsonResponse(403, { error: { code: 403, message: 'The caller does not have permission', status: 'PERMISSION_DENIED' } }));

    const error = await DataManagerApi.ingestAudienceMembers({ auth: AUTH, body: ingestBody() }).catch((failure: unknown) => failure);

    expect(error).toBeInstanceOf(DataManagerApiError);
    expect(error).toMatchObject({ message: 'Data Manager API returned 403 (PERMISSION_DENIED): The caller does not have permission', status: 403 });
    expect(error).not.toHaveProperty('cause');
    const exposed = error instanceof Error ? [error.message, error.stack ?? '', JSON.stringify(error), JSON.stringify(Object.entries(error))] : [];
    expect(exposed).toHaveLength(4);
    expect(exposed.some((text) => text.includes(HASHED_EMAIL))).toBe(false);
    expect(exposed.some((text) => text.includes(TOKEN))).toBe(false);
    logged.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('should report a network failure or a timeout without a cause and without the request', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed', { cause: new Error(JSON.stringify(ingestBody())) }));
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));

    const network = await DataManagerApi.ingestAudienceMembers({ auth: AUTH, body: ingestBody() }).catch((failure: unknown) => failure);
    const timeout = await DataManagerApi.ingestAudienceMembers({ auth: AUTH, body: ingestBody() }).catch((failure: unknown) => failure);

    expect(network).toMatchObject({ message: 'Could not reach the Data Manager API: fetch failed' });
    expect(timeout).toMatchObject({ message: 'Data Manager API did not answer within 60 seconds.' });
    for (const error of [network, timeout]) {
      expect(error).not.toHaveProperty('cause');
      expect(error instanceof Error ? `${error.message}${error.stack ?? ''}` : '').not.toContain(HASHED_EMAIL);
    }
    expect(logged).not.toHaveBeenCalled();
  });
});
