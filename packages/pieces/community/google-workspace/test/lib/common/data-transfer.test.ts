import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const network = vi.hoisted(() => ({ unexpectedCalls: 0 }));
const fetchMock = vi.hoisted(() =>
  vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  })
);
vi.stubGlobal('fetch', fetchMock);

const { GOOGLE_ADMIN_API_ROOT } = await import('../../../src/lib/common/client');
const { DataTransferApi, userProfileId } = await import('../../../src/lib/common/data-transfer');

const AUTH = { access_token: 'ya29.test-token' };

function replyOnce(body: unknown): void {
  fetchMock.mockImplementationOnce(async () => Response.json(body));
}

function sent(call: number): { url: URL; method: string | undefined; body: unknown } {
  const [input, init] = fetchMock.mock.calls[call] ?? [];
  return { url: new URL(String(input)), method: init?.method, body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) };
}

function pathOf(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

beforeEach(() => {
  network.unexpectedCalls = 0;
  fetchMock.mockReset().mockImplementation(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  expect(network.unexpectedCalls).toBe(0);
});

describe('DataTransferApi', () => {
  it('should list transferable applications under my_customer, following pages', async () => {
    replyOnce({ applications: [{ id: '1', name: 'Drive and Docs' }], nextPageToken: 'p2' });
    replyOnce({ applications: [{ id: '2', name: 'Calendar' }] });

    const apps = await DataTransferApi.listApplications(AUTH);

    expect(apps.map((a) => a.name)).toEqual(['Drive and Docs', 'Calendar']);
    const first = sent(0);
    expect(pathOf(first.url)).toBe(`${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/applications`);
    expect(Object.fromEntries(first.url.searchParams)).toEqual({ customerId: 'my_customer', maxResults: '100' });
  });

  it('should POST a transfer and GET it by id', async () => {
    replyOnce({ id: 't1', overallTransferStatusCode: 'inProgress' });
    const transfer = { oldOwnerUserId: '1', newOwnerUserId: '2', applicationDataTransfers: [{ applicationId: '55' }] };

    await expect(DataTransferApi.createTransfer({ auth: AUTH, transfer })).resolves.toEqual({ id: 't1', overallTransferStatusCode: 'inProgress' });
    expect(sent(0)).toEqual({ url: new URL(`${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/transfers`), method: 'POST', body: transfer });

    replyOnce({ id: 't1', overallTransferStatusCode: 'completed' });
    await expect(DataTransferApi.getTransfer({ auth: AUTH, transferId: 't1' })).resolves.toEqual({ id: 't1', overallTransferStatusCode: 'completed' });
    expect(sent(1)).toEqual({ url: new URL(`${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/transfers/t1`), method: 'GET', body: undefined });
  });
});

describe('userProfileId()', () => {
  it('should pass numeric ids through without a lookup', async () => {
    await expect(userProfileId({ auth: AUTH, userKey: ' 1122334455 ' })).resolves.toBe('1122334455');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should look up an e-mail in the Directory and return its id', async () => {
    replyOnce({ id: '998877', primaryEmail: 'jane@example.com' });

    await expect(userProfileId({ auth: AUTH, userKey: 'jane@example.com' })).resolves.toBe('998877');
    const request = sent(0);
    expect(pathOf(request.url)).toBe(`${GOOGLE_ADMIN_API_ROOT}/admin/directory/v1/users/jane%40example.com`);
    expect(Object.fromEntries(request.url.searchParams)).toEqual({ projection: 'basic' });
  });

  it('should refuse an empty key and a user without id', async () => {
    await expect(userProfileId({ auth: AUTH, userKey: '' })).rejects.toThrow('A user e-mail or id is required.');
    replyOnce({ primaryEmail: 'x@example.com' });
    await expect(userProfileId({ auth: AUTH, userKey: 'x@example.com' })).rejects.toThrow('Google returned no id for user "x@example.com".');
  });
});
