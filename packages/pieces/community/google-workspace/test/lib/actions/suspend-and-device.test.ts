import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.hoisted(() => vi.fn<() => Promise<unknown>>());
const resolveAuth = vi.hoisted(() => vi.fn<() => Promise<{ access_token: string }>>());

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleWorkspaceApi: { ...actual.GoogleWorkspaceApi, request } };
});
vi.mock('../../../src/lib/common/token', () => ({ resolveAuth }));

const { suspendUser } = await import('../../../src/lib/actions/suspend-user');
const { MOBILE_DEVICE_ACTIONS, mobileDeviceAction } = await import('../../../src/lib/actions/mobile-device-action');

const AUTH = { type: 'OAUTH2', access_token: 'tok' };
const RESOLVED = { access_token: 'resolved' };

type Runnable = { run: (ctx: unknown) => Promise<unknown> };
const run = (action: Runnable, propsValue: Record<string, unknown>) => action.run({ auth: AUTH, propsValue });

beforeEach(() => {
  request.mockReset();
  resolveAuth.mockReset().mockResolvedValue(RESOLVED);
});

describe('suspendUser', () => {
  it('should PATCH suspended=true by default and summarize the user', async () => {
    request.mockResolvedValue({ id: '1', primaryEmail: 'jane@example.com', suspended: true, suspensionReason: 'ADMIN' });

    const result = await run(suspendUser, { userKey: 'jane@example.com' });

    expect(request).toHaveBeenCalledWith({
      auth: RESOLVED,
      method: 'PATCH',
      path: 'admin/directory/v1/users/jane%40example.com',
      body: { suspended: true },
    });
    expect(result).toEqual({
      id: '1',
      primaryEmail: 'jane@example.com',
      suspended: true,
      suspensionReason: 'ADMIN',
      record: { id: '1', primaryEmail: 'jane@example.com', suspended: true, suspensionReason: 'ADMIN' },
    });
  });

  it('should lift the suspension when the checkbox is off', async () => {
    request.mockResolvedValue({ id: '1', primaryEmail: 'jane@example.com', suspended: false });

    const result = await run(suspendUser, { userKey: '1', suspended: false });

    expect(request).toHaveBeenCalledWith(expect.objectContaining({ auth: RESOLVED, path: 'admin/directory/v1/users/1', body: { suspended: false } }));
    expect(result).toMatchObject({ suspended: false, suspensionReason: null });
  });
});

describe('mobileDeviceAction', () => {
  it('should offer the six Directory actions', () => {
    expect(MOBILE_DEVICE_ACTIONS.map((a) => a.value)).toEqual([
      'approve',
      'block',
      'admin_account_wipe',
      'admin_remote_wipe',
      'cancel_remote_wipe_then_activate',
      'cancel_remote_wipe_then_block',
    ]);
  });

  it('should POST the action to the device and report success (Google answers 204)', async () => {
    request.mockResolvedValue(undefined);

    const result = await run(mobileDeviceAction, { resourceId: 'AFiQxQ-abc', action: 'block' });

    expect(request).toHaveBeenCalledWith({
      auth: RESOLVED,
      method: 'POST',
      path: 'admin/directory/v1/customer/my_customer/devices/mobile/AFiQxQ-abc/action',
      body: { action: 'block' },
    });
    expect(result).toEqual({ resourceId: 'AFiQxQ-abc', action: 'block', success: true });
  });
});
