import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  listApplications: vi.fn<() => Promise<unknown>>(),
  createTransfer: vi.fn<() => Promise<unknown>>(),
  getTransfer: vi.fn<(params: { auth: unknown; transferId: string; timeoutMs?: number }) => Promise<unknown>>(),
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
  it('should hide Retry On Failure and default it to off so a timeout rethrow never starts a second transfer', () => {
    expect(transferData.errorHandlingOptions).toEqual({
      continueOnFailure: { defaultValue: false },
      retryOnFailure: { defaultValue: false, hide: true },
    });
  });

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
    expect(api.getTransfer).toHaveBeenNthCalledWith(1, { auth: RESOLVED, transferId: 't1', timeoutMs: 110_000 });
    expect(api.getTransfer).toHaveBeenNthCalledWith(2, { auth: RESOLVED, transferId: 't1', timeoutMs: 100_000 });
    expect(result).toMatchObject({ transferId: 't1', status: 'completed', applications: [] });
  });

  it('should fail with the transfer id when the transfer is still running after the last poll', async () => {
    vi.useFakeTimers();
    const running = { id: 't2', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' };
    api.createTransfer.mockResolvedValue(running);
    api.getTransfer.mockResolvedValue(running);

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: true });
    const outcome = expect(pending).rejects.toThrow(
      'Transfer t2 is still running in Google after waiting 120 seconds. It was not cancelled and will finish on its own. Check its status with Custom API Call (GET /admin/datatransfer/v1/transfers/t2), or turn Wait for Completion off'
    );
    await vi.advanceTimersByTimeAsync(130_000);
    await outcome;

    expect(api.getTransfer).toHaveBeenCalledTimes(11);
  });

  it('should stop at the 120 second deadline even when each status call is slow', async () => {
    vi.useFakeTimers();
    const running = { id: 't4', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' };
    api.createTransfer.mockResolvedValue(running);
    api.getTransfer.mockImplementation(
      ({ timeoutMs = 60_000 }) =>
        new Promise((resolve, reject) => {
          if (timeoutMs < 70_000) {
            setTimeout(() => reject(new Error('Could not reach the Google Workspace API (TimeoutError). Try again in a moment.')), timeoutMs);
            return;
          }
          setTimeout(() => resolve(running), 70_000);
        })
    );
    const startedAt = Date.now();
    let settledAt = 0;

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: true }).finally(() => {
      settledAt = Date.now();
    });
    const outcome = expect(pending).rejects.toThrow('Transfer t4 is still running in Google after waiting 120 seconds.');
    await vi.advanceTimersByTimeAsync(1_000_000);
    await outcome;

    expect(settledAt - startedAt).toBe(120_000);
    expect(api.getTransfer.mock.calls.map(([params]) => params.timeoutMs)).toEqual([110_000, 30_000]);
  });

  it('should return normally when a slow status call reports completion before the deadline', async () => {
    vi.useFakeTimers();
    api.createTransfer.mockResolvedValue({ id: 't5', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' });
    api.getTransfer.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ id: 't5', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'completed' }), 100_000);
        })
    );

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: true });
    await vi.advanceTimersByTimeAsync(115_000);
    const result = await pending;

    expect(api.getTransfer).toHaveBeenCalledTimes(1);
    expect(api.getTransfer).toHaveBeenCalledWith({ auth: RESOLVED, transferId: 't5', timeoutMs: 110_000 });
    expect(result).toMatchObject({ transferId: 't5', status: 'completed' });
  });

  it('should surface a status call failure that happens before the deadline with the transfer id', async () => {
    vi.useFakeTimers();
    api.createTransfer.mockResolvedValue({ id: 't6', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' });
    api.getTransfer.mockRejectedValue(new Error('Google Workspace API returned 403'));

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: true });
    const outcome = expect(pending).rejects.toThrow(
      'Transfer t6 was started in Google and was not cancelled, but checking its status failed: Google Workspace API returned 403. Check it with Custom API Call (GET /admin/datatransfer/v1/transfers/t6) before running this step again.'
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
  });

  it('should fail with the transfer id when the transfer ends as failed', async () => {
    vi.useFakeTimers();
    api.createTransfer.mockResolvedValue({ id: 't7', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' });
    api.getTransfer.mockResolvedValue({
      id: 't7',
      oldOwnerUserId: '111',
      newOwnerUserId: '222',
      overallTransferStatusCode: 'failed',
      applicationDataTransfers: [{ applicationId: '55656082996', applicationTransferStatus: 'failed' }],
    });

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '55656082996', waitForCompletion: true });
    const outcome = expect(pending).rejects.toThrow(
      'Transfer t7 did not complete in Google (status: failed; application 55656082996: failed). The data of From User may not have moved, so do not delete that user yet. Check the details with Custom API Call (GET /admin/datatransfer/v1/transfers/t7)'
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;

    expect(api.getTransfer).toHaveBeenCalledTimes(1);
  });

  it('should fail when the transfer completes but an application failed', async () => {
    vi.useFakeTimers();
    api.createTransfer.mockResolvedValue({ id: 't8', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' });
    api.getTransfer.mockResolvedValue({
      id: 't8',
      oldOwnerUserId: '111',
      newOwnerUserId: '222',
      overallTransferStatusCode: 'completed',
      applicationDataTransfers: [{ applicationId: '1', applicationTransferStatus: 'failed' }],
    });

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: true });
    const outcome = expect(pending).rejects.toThrow('Transfer t8 did not complete in Google (status: completed; application 1: failed).');
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
  });

  it('should fail on any final status other than completed when asked to wait', async () => {
    vi.useFakeTimers();
    api.createTransfer.mockResolvedValue({ id: 't9', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' });
    api.getTransfer.mockResolvedValue({ id: 't9', oldOwnerUserId: '111', newOwnerUserId: '222' });

    const pending = run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: true });
    const outcome = expect(pending).rejects.toThrow('Transfer t9 did not complete in Google (status: unknown).');
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
  });

  it('should fail with the transfer id when Google reports a failed transfer right away, even without waiting', async () => {
    api.createTransfer.mockResolvedValue({ id: 't10', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'failed' });

    await expect(run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: false })).rejects.toThrow(
      'Transfer t10 did not complete in Google (status: failed).'
    );
    expect(api.getTransfer).not.toHaveBeenCalled();
  });

  it('should not poll or fail on a running transfer when not asked to wait', async () => {
    api.createTransfer.mockResolvedValue({ id: 't3', oldOwnerUserId: '111', newOwnerUserId: '222', overallTransferStatusCode: 'inProgress' });

    const result = await run({ oldOwner: 'old@example.com', newOwner: 'new@example.com', applicationId: '1', waitForCompletion: false });

    expect(api.getTransfer).not.toHaveBeenCalled();
    expect(result).toMatchObject({ transferId: 't3', status: 'inProgress' });
  });

  it('should refuse a transfer to the same user before calling Google', async () => {
    userProfileId.mockResolvedValue('111');

    await expect(run({ oldOwner: 'old@example.com', newOwner: 'old@example.com', applicationId: '1' })).rejects.toThrow('same account');
    expect(api.createTransfer).not.toHaveBeenCalled();
  });
});
