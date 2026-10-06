import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { GOOGLE_ADMIN_API_ROOT } = await import('../../../src/lib/common/client');
const { DataTransferApi, userProfileId } = await import('../../../src/lib/common/data-transfer');

const AUTH = { access_token: 'ya29.test-token' };

beforeEach(() => {
  sendRequest.mockReset();
});

describe('DataTransferApi', () => {
  it('should list transferable applications under my_customer, following pages', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { applications: [{ id: '1', name: 'Drive and Docs' }], nextPageToken: 'p2' } })
      .mockResolvedValueOnce({ body: { applications: [{ id: '2', name: 'Calendar' }] } });

    const apps = await DataTransferApi.listApplications(AUTH);

    expect(apps.map((a) => a.name)).toEqual(['Drive and Docs', 'Calendar']);
    expect(sendRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: `${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/applications`,
        queryParams: { customerId: 'my_customer', maxResults: '100' },
      })
    );
  });

  it('should POST a transfer and GET it by id', async () => {
    sendRequest.mockResolvedValueOnce({ body: { id: 't1', overallTransferStatusCode: 'inProgress' } });
    const transfer = { oldOwnerUserId: '1', newOwnerUserId: '2', applicationDataTransfers: [{ applicationId: '55' }] };

    await expect(DataTransferApi.createTransfer({ auth: AUTH, transfer })).resolves.toEqual({ id: 't1', overallTransferStatusCode: 'inProgress' });
    expect(sendRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'POST', url: `${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/transfers`, body: transfer })
    );

    sendRequest.mockResolvedValueOnce({ body: { id: 't1', overallTransferStatusCode: 'completed' } });
    await expect(DataTransferApi.getTransfer({ auth: AUTH, transferId: 't1' })).resolves.toEqual({ id: 't1', overallTransferStatusCode: 'completed' });
    expect(sendRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'GET', url: `${GOOGLE_ADMIN_API_ROOT}/admin/datatransfer/v1/transfers/t1` })
    );
  });
});

describe('userProfileId()', () => {
  it('should pass numeric ids through without a lookup', async () => {
    await expect(userProfileId({ auth: AUTH, userKey: ' 1122334455 ' })).resolves.toBe('1122334455');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('should look up an e-mail in the Directory and return its id', async () => {
    sendRequest.mockResolvedValue({ body: { id: '998877', primaryEmail: 'jane@example.com' } });

    await expect(userProfileId({ auth: AUTH, userKey: 'jane@example.com' })).resolves.toBe('998877');
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: `${GOOGLE_ADMIN_API_ROOT}/admin/directory/v1/users/jane%40example.com`, queryParams: { projection: 'basic' } })
    );
  });

  it('should refuse an empty key and a user without id', async () => {
    await expect(userProfileId({ auth: AUTH, userKey: '' })).rejects.toThrow('A user e-mail or id is required.');
    sendRequest.mockResolvedValue({ body: { primaryEmail: 'x@example.com' } });
    await expect(userProfileId({ auth: AUTH, userKey: 'x@example.com' })).rejects.toThrow('Google returned no id for user "x@example.com".');
  });
});
