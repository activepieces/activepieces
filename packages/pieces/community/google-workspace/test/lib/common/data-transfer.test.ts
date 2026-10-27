import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const network = vi.hoisted(() => ({ unexpectedCalls: 0 }));
const fetchMock = vi.hoisted(() =>
  vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  })
);
vi.stubGlobal('fetch', fetchMock);

const { googleWorkspaceClient } = await import('../../../src/lib/common/client');
const { googleWorkspaceProps } = await import('../../../src/lib/common/props');
const { transferData } = await import('../../../src/lib/actions/transfer-data');

const GOOGLE_ADMIN_API_ROOT = googleWorkspaceClient.baseUrl();
const AUTH = { type: 'OAUTH2', access_token: 'ya29.test-token' };
const listApplications = () => googleWorkspaceProps.applicationId({ required: true }).options({ auth: AUTH } as never, {} as never);
const transfer = (propsValue: Record<string, unknown>) => transferData.run({ auth: AUTH, propsValue } as never);

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

describe('transferable applications', () => {
  it('should list them under my_customer, following pages', async () => {
    replyOnce({ applications: [{ id: '1', name: 'Drive and Docs' }], nextPageToken: 'p2' });
    replyOnce({ applications: [{ id: '2', name: 'Calendar' }] });

    const state = await listApplications();

    expect(state.options.map((o) => o.label)).toEqual(['Drive and Docs', 'Calendar']);
    const first = sent(0);
    expect(pathOf(first.url)).toBe(`${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/applications`);
    expect(Object.fromEntries(first.url.searchParams)).toEqual({ customerId: 'my_customer', maxResults: '100' });
  });
});

describe('transfer requests', () => {
  it('should POST the transfer, passing numeric user ids through without a lookup', async () => {
    replyOnce({ id: 't1', oldOwnerUserId: '1', newOwnerUserId: '2', overallTransferStatusCode: 'inProgress' });

    await transfer({ oldOwner: ' 1 ', newOwner: '2', applicationId: '55' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sent(0)).toEqual({
      url: new URL(`${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/transfers`),
      method: 'POST',
      body: { oldOwnerUserId: '1', newOwnerUserId: '2', applicationDataTransfers: [{ applicationId: '55' }] },
    });
  });

  it('should look up an e-mail in the Directory and use its id', async () => {
    replyOnce({ id: '998877', primaryEmail: 'jane@example.com' });
    replyOnce({ id: 't1', oldOwnerUserId: '998877', newOwnerUserId: '2', overallTransferStatusCode: 'inProgress' });

    await transfer({ oldOwner: 'jane@example.com', newOwner: '2', applicationId: '55' });

    const lookup = sent(0);
    expect(pathOf(lookup.url)).toBe(`${GOOGLE_ADMIN_API_ROOT}/admin/directory/v1/users/jane%40example.com`);
    expect(Object.fromEntries(lookup.url.searchParams)).toEqual({ projection: 'basic' });
    expect(sent(1).body).toMatchObject({ oldOwnerUserId: '998877' });
  });

  it('should refuse an empty key and a user without id', async () => {
    await expect(transfer({ oldOwner: '', newOwner: '2', applicationId: '55' })).rejects.toThrow('A user e-mail or id is required.');
    replyOnce({ primaryEmail: 'x@example.com' });
    await expect(transfer({ oldOwner: 'x@example.com', newOwner: '2', applicationId: '55' })).rejects.toThrow('Google returned no id for user "x@example.com".');
  });
});
