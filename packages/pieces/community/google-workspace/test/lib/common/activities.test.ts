import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const network = vi.hoisted(() => ({ unexpectedCalls: 0 }));
const fetchMock = vi.hoisted(() =>
  vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  })
);
vi.stubGlobal('fetch', fetchMock);

const { ACTIVITY_APPLICATIONS, CHANNEL_MAX_LIFETIME_MS, ReportsApi, SAMPLE_EVENT, flattenActivity, isActivity, newChannelRequest } =
  await import('../../../src/lib/common/activities');

const AUTH = { access_token: 'tok' };
const ROOT = 'https://admin.googleapis.com';

function answerWith(response: () => Response): void {
  fetchMock.mockImplementation(async () => response());
}

function sent(call = 0): { url: URL; method: string | undefined; body: unknown } {
  const [input, init] = fetchMock.mock.calls[call] ?? [];
  return { url: new URL(String(input)), method: init?.method, body: init?.body === undefined ? undefined : JSON.parse(String(init.body)) };
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

describe('ReportsApi', () => {
  it('should list activities of an application for all users with the optional filters', async () => {
    answerWith(() => Response.json({ items: [{ id: { time: 't' }, events: [] }] }));

    const items = await ReportsApi.listActivities({ auth: AUTH, query: { application: 'admin', eventName: 'CREATE_USER', filters: ' ', maxResults: 50 } });

    expect(items).toEqual([{ id: { time: 't' }, events: [] }]);
    const request = sent();
    expect(request.method).toBe('GET');
    expect(`${request.url.origin}${request.url.pathname}`).toBe(`${ROOT}/admin/reports/v1/activity/users/all/applications/admin`);
    expect(Object.fromEntries(request.url.searchParams)).toEqual({ eventName: 'CREATE_USER', maxResults: '50' });
  });

  it('should open a web_hook channel with the token and the 6-hour expiration', async () => {
    answerWith(() => Response.json({ id: 'chan-1', resourceId: 'res-1', expiration: '1700021600000' }));

    const channel = await ReportsApi.watch({
      auth: AUTH,
      query: { application: 'drive', userKey: 'jane@example.com', eventName: 'download' },
      channel: { id: 'chan-1', address: 'https://ipaas.example/webhooks/abc', token: 'secret', expiration: 1_700_021_600_000 },
    });

    expect(channel).toEqual({ id: 'chan-1', resourceId: 'res-1', expiration: '1700021600000' });
    const request = sent();
    expect(request.method).toBe('POST');
    expect(`${request.url.origin}${request.url.pathname}`).toBe(`${ROOT}/admin/reports/v1/activity/users/jane%40example.com/applications/drive/watch`);
    expect(Object.fromEntries(request.url.searchParams)).toEqual({ eventName: 'download' });
    expect(request.body).toEqual({
      id: 'chan-1',
      type: 'web_hook',
      address: 'https://ipaas.example/webhooks/abc',
      token: 'secret',
      expiration: '1700021600000',
      payload: true,
    });
  });

  it('should keep the channel token out of the error when watch fails', async () => {
    answerWith(() => Response.json({ error: { code: 400, message: 'Invalid address', errors: [{ reason: 'invalid', message: 'Invalid address' }] } }, { status: 400 }));
    const spies = (['error', 'log', 'warn'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));

    const failure = await ReportsApi.watch({
      auth: AUTH,
      query: { application: 'admin' },
      channel: { id: 'chan-1', address: 'https://ipaas.example/webhooks/abc', token: 'channel-secret-token', expiration: 1 },
    }).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    expect(failure).toMatchObject({ message: 'Google Workspace API returned 400: invalid: Invalid address' });
    expect(JSON.stringify(failure, Object.getOwnPropertyNames(failure))).not.toContain('channel-secret-token');
    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('should stop a channel through the reports_v1 channels endpoint and accept the empty 204 reply', async () => {
    answerWith(() => new Response(null, { status: 204 }));

    await expect(ReportsApi.stop({ auth: AUTH, channel: { id: 'chan-1', resourceId: 'res-1' } })).resolves.toBeUndefined();

    const request = sent();
    expect(request.method).toBe('POST');
    expect(request.url.toString()).toBe(`${ROOT}/admin/reports_v1/channels/stop`);
    expect(request.body).toEqual({ id: 'chan-1', resourceId: 'res-1' });
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
