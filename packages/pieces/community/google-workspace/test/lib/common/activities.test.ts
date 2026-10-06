import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { ACTIVITY_APPLICATIONS, CHANNEL_MAX_LIFETIME_MS, ReportsApi, SAMPLE_EVENT, flattenActivity, isActivity, newChannelRequest } =
  await import('../../../src/lib/common/activities');

const AUTH = { access_token: 'tok' };
const ROOT = 'https://admin.googleapis.com';

describe('ReportsApi', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('should list activities of an application for all users with the optional filters', async () => {
    sendRequest.mockResolvedValue({ body: { items: [{ id: { time: 't' }, events: [] }] } });

    const items = await ReportsApi.listActivities({ auth: AUTH, query: { application: 'admin', eventName: 'CREATE_USER', filters: ' ', maxResults: 50 } });

    expect(items).toEqual([{ id: { time: 't' }, events: [] }]);
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `${ROOT}/admin/reports/v1/activity/users/all/applications/admin`,
        queryParams: { eventName: 'CREATE_USER', maxResults: '50' },
      })
    );
  });

  it('should open a web_hook channel with the token and the 6-hour expiration', async () => {
    sendRequest.mockResolvedValue({ body: { id: 'chan-1', resourceId: 'res-1', expiration: '1700021600000' } });

    const channel = await ReportsApi.watch({
      auth: AUTH,
      query: { application: 'drive', userKey: 'jane@example.com', eventName: 'download' },
      channel: { id: 'chan-1', address: 'https://ipaas.example/webhooks/abc', token: 'secret', expiration: 1_700_021_600_000 },
    });

    expect(channel).toEqual({ id: 'chan-1', resourceId: 'res-1', expiration: '1700021600000' });
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: `${ROOT}/admin/reports/v1/activity/users/jane%40example.com/applications/drive/watch`,
        queryParams: { eventName: 'download' },
        body: {
          id: 'chan-1',
          type: 'web_hook',
          address: 'https://ipaas.example/webhooks/abc',
          token: 'secret',
          expiration: '1700021600000',
          payload: true,
        },
      })
    );
  });

  it('should stop a channel through the reports_v1 channels endpoint', async () => {
    sendRequest.mockResolvedValue({ body: undefined });

    await ReportsApi.stop({ auth: AUTH, channel: { id: 'chan-1', resourceId: 'res-1' } });

    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', url: `${ROOT}/admin/reports_v1/channels/stop`, body: { id: 'chan-1', resourceId: 'res-1' } })
    );
  });
});

describe('newChannelRequest()', () => {
  it('should mint distinct uuids for the id and the token, expiring in six hours', () => {
    const request = newChannelRequest({ address: 'https://hook', now: 1_000 });

    expect(request.address).toBe('https://hook');
    expect(request.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(request.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(request.id).not.toBe(request.token);
    expect(request.expiration).toBe(1_000 + CHANNEL_MAX_LIFETIME_MS);
  });
});

describe('flattenActivity()', () => {
  it('should emit one item per event with parameters as an object', () => {
    const activity = {
      id: { time: '2026-10-05T10:00:00.000Z', uniqueQualifier: '42', applicationName: 'admin' },
      actor: { email: 'admin@example.com', profileId: '1', callerType: 'USER' },
      ipAddress: '1.2.3.4',
      ownerDomain: 'example.com',
      events: [
        { type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [{ name: 'USER_EMAIL', value: 'jane@example.com' }] },
        {
          type: 'USER_SETTINGS',
          name: 'CHANGE_FIRST_NAME',
          parameters: [
            { name: 'USER_EMAIL', value: 'jane@example.com' },
            { name: 'NEW_VALUE', value: 'Jane' },
            { name: 'COUNT', intValue: '3' },
            { name: 'FLAG', boolValue: true },
            { name: 'LIST', multiValue: ['a', 'b'] },
            { value: 'nameless' },
          ],
        },
      ],
    };

    const events = flattenActivity(activity);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      id: '2026-10-05T10:00:00.000Z:42:0',
      time: '2026-10-05T10:00:00.000Z',
      application: 'admin',
      eventType: 'USER_SETTINGS',
      eventName: 'CREATE_USER',
      actor: { email: 'admin@example.com', profileId: '1', callerType: 'USER' },
      ipAddress: '1.2.3.4',
      ownerDomain: 'example.com',
      parameters: { USER_EMAIL: 'jane@example.com' },
    });
    expect(events[1]?.id).toBe('2026-10-05T10:00:00.000Z:42:1');
    expect(events[1]?.parameters).toEqual({ USER_EMAIL: 'jane@example.com', NEW_VALUE: 'Jane', COUNT: '3', FLAG: true, LIST: ['a', 'b'] });
    expect(events[0]?.activity).toBe(activity);
  });

  it('should keep the plain activity id when there is a single event and tolerate missing fields', () => {
    expect(flattenActivity({ id: { time: 't', uniqueQualifier: 'q' }, events: [{ name: 'login_success' }] })).toEqual([
      expect.objectContaining({
        id: 't:q',
        eventName: 'login_success',
        eventType: null,
        actor: { email: null, profileId: null, callerType: null },
        parameters: {},
      }),
    ]);
    expect(flattenActivity({})).toEqual([]);
  });
});

describe('isActivity()', () => {
  it('should recognise a notification body with events and reject sync/empty bodies', () => {
    expect(isActivity(SAMPLE_EVENT.activity)).toBe(true);
    expect(isActivity({})).toBe(false);
    expect(isActivity('')).toBe(false);
    expect(isActivity(null)).toBe(false);
  });
});

describe('ACTIVITY_APPLICATIONS', () => {
  it('should be unique values with labels, including the common audit logs', () => {
    const values = ACTIVITY_APPLICATIONS.map((a) => a.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toEqual(expect.arrayContaining(['admin', 'login', 'drive', 'calendar', 'groups', 'mobile', 'user_accounts', 'token', 'saml']));
  });
});
