import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  listApplications: vi.fn<() => Promise<unknown>>(),
  createTransfer: vi.fn<() => Promise<unknown>>(),
  getTransfer: vi.fn<() => Promise<unknown>>(),
}));
const userProfileId = vi.hoisted(() => vi.fn<(params: { auth: unknown; userKey: string }) => Promise<string>>());
const resolveAuth = vi.hoisted(() => vi.fn<() => Promise<{ access_token: string }>>());

vi.mock('../../../src/lib/common/data-transfer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/data-transfer')>();
  return { ...actual, DataTransferApi: api, userProfileId };
});
vi.mock('../../../src/lib/common/token', () => ({ resolveAuth }));

const { applicationOptions, toTransferParams, transferData } = await import('../../../src/lib/actions/transfer-data');

const AUTH = { type: 'OAUTH2', access_token: 'tok' };
const RESOLVED = { access_token: 'resolved' };

const run = (propsValue: Record<string, unknown>) => transferData.run({ auth: AUTH, propsValue } as never);

beforeEach(() => {
  for (const fn of Object.values(api)) fn.mockReset();
  userProfileId.mockReset().mockImplementation(async ({ userKey }) => (userKey === 'old@example.com' ? '111' : '222'));
  resolveAuth.mockReset().mockResolvedValue(RESOLVED);
  vi.useRealTimers();
});

describe('toTransferParams()', () => {
  it('should turn comma-separated strings and arrays into the API key/value shape', () => {
    expect(toTransferParams({ PRIVACY_LEVEL: 'SHARED, PRIVATE', RELEASE_RESOURCES: ['TRUE'], EMPTY: '' })).toEqual([
      { key: 'PRIVACY_LEVEL', value: ['SHARED', 'PRIVATE'] },
      { key: 'RELEASE_RESOURCES', value: ['TRUE'] },
    ]);
    expect(toTransferParams(undefined)).toEqual([]);
  });
});

describe('applicationOptions()', () => {
  it('should label applications with their parameters', async () => {
    api.listApplications.mockResolvedValue([
      { id: '55656082996', name: 'Drive and Docs', transferParams: [{ key: 'PRIVACY_LEVEL', value: ['SHARED', 'PRIVATE'] }] },
      { id: '435070579839', name: 'Calendar', transferParams: [{ key: 'RELEASE_RESOURCES', value: ['TRUE', 'FALSE'] }] },
      { id: '1', name: 'Looker Studio' },
    ]);

    await expect(applicationOptions(AUTH as never)).resolves.toEqual({
      disabled: false,
      options: [
        { label: 'Drive and Docs (PRIVACY_LEVEL: SHARED|PRIVATE)', value: '55656082996' },
        { label: 'Calendar (RELEASE_RESOURCES: TRUE|FALSE)', value: '435070579839' },
        { label: 'Looker Studio', value: '1' },
      ],
    });
    expect(api.listApplications).toHaveBeenCalledWith(RESOLVED);
  });

  it('should degrade without a connection, and surface the error when Google fails', async () => {
    await expect(applicationOptions(undefined)).resolves.toMatchObject({ disabled: true, options: [] });
    api.listApplications.mockRejectedValue(new Error('Google Workspace API returned 403 (PERMISSION_DENIED): forbidden: Not Authorized'));
    await expect(applicationOptions(AUTH as never)).resolves.toMatchObject({
      disabled: true,
      placeholder: 'An error occurred while listing the transferable applications: Google Workspace API returned 403 (PERMISSION_DENIED): forbidden: Not Authorized',
    });
  });
});

describe('transferData', () => {
  it('should resolve both users to profile ids and create the transfer with the parameters', async () => {
    api.createTransfer.mockResolvedValue({
      id: 'AKrEtIbj',
      oldOwnerUserId: '111',
      newOwnerUserId: '222',
      overallTransferStatusCode: 'inProgress',
      requestTime: '2026-10-05T10:00:00.000Z',
      applicationDataTransfers: [
        { applicationId: '55656082996', applicationTransferStatus: 'pending', applicationTransferParams: [{ key: 'PRIVACY_LEVEL', value: ['SHARED'] }] },
      ],
    });

    const result = await run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '55656082996', transferParams: { PRIVACY_LEVEL: 'SHARED' } });

    expect(api.createTransfer).toHaveBeenCalledWith({
      auth: RESOLVED,
      transfer: {
        oldOwnerUserId: '111',
        newOwnerUserId: '222',
        applicationDataTransfers: [{ applicationId: '55656082996', applicationTransferParams: [{ key: 'PRIVACY_LEVEL', value: ['SHARED'] }] }],
      },
    });
    expect(api.getTransfer).not.toHaveBeenCalled();
    expect(result).toEqual({
      transferId: 'AKrEtIbj',
      status: 'inProgress',
      oldOwnerUserId: '111',
      newOwnerUserId: '222',
      requestTime: '2026-10-05T10:00:00.000Z',
      applications: [{ applicationId: '55656082996', status: 'pending', params: [{ key: 'PRIVACY_LEVEL', value: ['SHARED'] }] }],
    });
  });

  it('should poll until the transfer completes when asked to wait', async () => {
    vi.useFakeTimers();
    api.createTransfer.mockResolvedValue({ id: 't1', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' });
    api.getTransfer
      .mockResolvedValueOnce({ id: 't1', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' })
      .mockResolvedValueOnce({ id: 't1', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'completed' });

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: true });
    await vi.advanceTimersByTimeAsync(25_000);
    const result = await pending;

    expect(api.getTransfer).toHaveBeenCalledTimes(2);
    expect(api.getTransfer).toHaveBeenCalledWith({ auth: RESOLVED, transferId: 't1' });
    expect(result).toMatchObject({ transferId: 't1', status: 'completed', applications: [] });
  });

  it('should refuse a transfer to the same user before calling Google', async () => {
    userProfileId.mockResolvedValue('111');

    await expect(run({ oldOwner: 'old@example.com', newOwner: 'old@example.com', applicationId: '1' })).rejects.toThrow('same account');
    expect(api.createTransfer).not.toHaveBeenCalled();
  });
});
