import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushbullet } from '../src/index';
import { bushbulletAuth } from '../src/lib/common/auth';
import { PushbulletApiError, pushbulletApi } from '../src/lib/common/client';
import { sendALink } from '../src/lib/actions/send-a-link';
import { sendANote } from '../src/lib/actions/send-a-note';
import { aiSendNote } from '../src/lib/actions/ai/send-note';
import { aiSendLink } from '../src/lib/actions/ai/send-link';
import { aiListPushes } from '../src/lib/actions/ai/list-pushes';
import { aiDismissPush } from '../src/lib/actions/ai/dismiss-push';
import { aiDeletePush } from '../src/lib/actions/ai/delete-push';
import { aiListDevices } from '../src/lib/actions/ai/list-devices';
import { aiListChats } from '../src/lib/actions/ai/list-chats';
import { aiGetCurrentUser } from '../src/lib/actions/ai/get-current-user';

const TOKEN = 'o.tok123';
const AUTH = { secret_text: TOKEN };
const BASE = 'https://api.pushbullet.com/v2';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockOk(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

function httpError({ status, body }: { status: number; body: unknown }): HttpError {
  return new HttpError(undefined, { status, responseBody: body });
}

function mockFail({ status, body }: { status: number; body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpError({ status, body }));
}

function firstCall(spy: ReturnType<typeof mockOk>) {
  return spy.mock.calls[0][0];
}

const HEADERS = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('piece metadata', () => {
  it('has no both-audience actions, ai actions carry aiMetadata, all carry outputSchema', () => {
    const actions = Object.values(pushbullet.actions());
    for (const action of actions) {
      expect(action.audience, action.name).not.toBe('both');
      if (action.name === 'custom_api_call') continue;
      expect(action.outputSchema, action.name).toBeDefined();
      if (action.audience === 'ai') {
        expect(action.aiMetadata, action.name).toBeDefined();
      }
    }
    expect(pushbullet.actions()['sendANote'].audience).toBe('human');
    expect(pushbullet.actions()['sendALink'].audience).toBe('human');
    expect(pushbullet.actions()['ai_delete_push'].aiMetadata?.idempotent).toBe(false);
    expect(pushbullet.actions()['ai_dismiss_push'].aiMetadata?.idempotent).toBe(true);
    expect(pushbullet.actions()['ai_send_note'].aiMetadata?.idempotent).toBe(false);
    expect(pushbullet.minimumSupportedRelease).toBe('0.86.4');
  });
});

describe('send actions build exact requests', () => {
  it('sendANote with device', async () => {
    const spy = mockOk({ iden: 'p1' });
    const out = await run({ action: sendANote, propsValue: { title: 'T', body: 'B', device: ' dev1 ', email: '' } });
    expect(out).toEqual({ iden: 'p1' });
    expect(firstCall(spy)).toEqual({
      method: HttpMethod.POST,
      url: `${BASE}/pushes`,
      headers: HEADERS,
      body: { type: 'note', title: 'T', body: 'B', device_iden: 'dev1' },
      queryParams: undefined,
    });
  });

  it('sendALink with email and no device', async () => {
    const spy = mockOk({ iden: 'p2' });
    await run({ action: sendALink, propsValue: { url: 'https://x.io', title: 'T', body: undefined, device: undefined, email: 'a@b.co' } });
    expect(firstCall(spy).body).toEqual({ type: 'link', url: 'https://x.io', title: 'T', body: undefined, email: 'a@b.co' });
  });

  it('ai_send_note with channel tag only', async () => {
    const spy = mockOk({ iden: 'p3' });
    await run({ action: aiSendNote, propsValue: { body: 'hello', channelTag: 'news' } });
    expect(firstCall(spy).body).toEqual({ type: 'note', title: undefined, body: 'hello', channel_tag: 'news' });
  });

  it('ai_send_note to a channel returns a confirmation when Pushbullet answers {}', async () => {
    mockOk({});
    const out = await run({ action: aiSendNote, propsValue: { title: 'T', body: 'hello', channelTag: 'news' } });
    expect(out).toEqual({ type: 'note', title: 'T', body: 'hello', channel_tag: 'news', sent_to_channel: true });
  });

  it('ai_send_link with no target sends no target keys', async () => {
    const spy = mockOk({ iden: 'p4' });
    await run({ action: aiSendLink, propsValue: { url: 'https://x.io', deviceIden: '  ', email: null } });
    const body = firstCall(spy).body;
    expect(body).toEqual({ type: 'link', url: 'https://x.io', title: undefined, body: undefined });
    expect(body).not.toHaveProperty('device_iden');
  });

  it.each([
    ['ai_send_note', aiSendNote, { body: 'b', deviceIden: 'd', email: 'e@x.io' }],
    ['ai_send_link', aiSendLink, { url: 'https://x', email: 'e@x.io', channelTag: 'c' }],
    ['sendANote', sendANote, { title: 't', body: 'b', device: 'd', email: 'e@x.io' }],
  ])('%s rejects multiple targets without calling the API', async (_n, action, propsValue) => {
    const spy = mockOk({});
    await expect(run({ action, propsValue })).rejects.toThrow('Choose only one target');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('push management', () => {
  it('ai_list_pushes defaults and clamps, maps empty response', async () => {
    const spy = mockOk({});
    const out = await run({ action: aiListPushes, propsValue: {} });
    expect(out).toEqual({ pushes: [], cursor: null });
    expect(firstCall(spy)).toMatchObject({
      method: HttpMethod.GET,
      url: `${BASE}/pushes`,
      queryParams: { active: 'true', limit: '20' },
    });
    expect(Object.keys(firstCall(spy).queryParams ?? {})).toEqual(['active', 'limit']);
  });

  it('ai_list_pushes passes modified_after, cursor and clamps a large limit', async () => {
    const spy = mockOk({ pushes: [{ iden: 'a' }], cursor: 'next' });
    const out = await run({ action: aiListPushes, propsValue: { modifiedAfter: 1700000000.5, limit: 9999, cursor: ' c1 ' } });
    expect(out).toEqual({ pushes: [{ iden: 'a' }], cursor: 'next' });
    expect(firstCall(spy).queryParams).toEqual({ active: 'true', limit: '500', modified_after: '1700000000.5', cursor: 'c1' });
  });

  it('ai_list_pushes clamps limit 0 to 1', async () => {
    const spy = mockOk({ pushes: [] });
    await run({ action: aiListPushes, propsValue: { limit: 0 } });
    expect(firstCall(spy).queryParams?.['limit']).toBe('1');
  });

  it('ai_dismiss_push posts dismissed:true to an encoded iden', async () => {
    const spy = mockOk({ iden: 'a/b', dismissed: true });
    await run({ action: aiDismissPush, propsValue: { iden: ' a/b ' } });
    expect(firstCall(spy)).toMatchObject({ method: HttpMethod.POST, url: `${BASE}/pushes/a%2Fb`, body: { dismissed: true } });
  });

  it('ai_delete_push sends DELETE and returns success', async () => {
    const spy = mockOk({});
    const out = await run({ action: aiDeletePush, propsValue: { iden: 'p9' } });
    expect(out).toEqual({ success: true, iden: 'p9' });
    expect(firstCall(spy)).toMatchObject({ method: HttpMethod.DELETE, url: `${BASE}/pushes/p9`, body: undefined });
  });

  it('ai_delete_push surfaces a 404 with the vendor message', async () => {
    mockFail({ status: 404, body: { error: { message: 'The resource could not be found.', type: 'invalid_request' } } });
    await expect(run({ action: aiDeletePush, propsValue: { iden: 'gone' } })).rejects.toThrow(
      'Pushbullet API request failed (404): The resource could not be found.'
    );
  });
});

describe('discovery', () => {
  it('ai_list_devices', async () => {
    const spy = mockOk({ devices: [{ iden: 'd1' }] });
    expect(await run({ action: aiListDevices, propsValue: {} })).toEqual({ devices: [{ iden: 'd1' }] });
    expect(firstCall(spy)).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/devices`, queryParams: { active: 'true' } });
  });

  it('ai_list_devices empty', async () => {
    mockOk({});
    expect(await run({ action: aiListDevices, propsValue: {} })).toEqual({ devices: [] });
  });

  it('ai_list_chats', async () => {
    const spy = mockOk({});
    expect(await run({ action: aiListChats, propsValue: {} })).toEqual({ chats: [] });
    expect(firstCall(spy)).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/chats`, queryParams: { active: 'true' } });
  });

  it('ai_get_current_user', async () => {
    const spy = mockOk({ iden: 'u1', email: 'a@b.co' });
    expect(await run({ action: aiGetCurrentUser, propsValue: {} })).toEqual({ iden: 'u1', email: 'a@b.co' });
    expect(firstCall(spy)).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/users/me`, headers: HEADERS });
  });
});

describe('error mapping', () => {
  it('maps object body to status + vendor message with responseBody and no body field', async () => {
    const vendor = { error: { message: 'Pushbullet Pro is required.', type: 'invalid_request', cat: '~(=^‥^)' } };
    mockFail({ status: 403, body: vendor });
    const err = await pushbulletApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/x' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PushbulletApiError);
    if (!(err instanceof PushbulletApiError)) throw new Error('expected PushbulletApiError');
    const e = err;
    expect(e.message).toBe('Pushbullet API request failed (403): Pushbullet Pro is required.');
    expect(e.status).toBe(403);
    expect(e.responseBody).toEqual(vendor);
    expect(Object.keys(e)).not.toContain('body');
  });

  it('parses a JSON-string error body (429)', async () => {
    mockFail({ status: 429, body: JSON.stringify({ error: { message: 'Rate limited' } }) });
    await expect(run({ action: aiListChats, propsValue: {} })).rejects.toThrow('Pushbullet API request failed (429): Rate limited');
  });

  it('uses plain-text body and falls back when body is empty or malformed', async () => {
    mockFail({ status: 502, body: 'Bad Gateway' });
    await expect(run({ action: aiListChats, propsValue: {} })).rejects.toThrow('(502): Bad Gateway');
    vi.restoreAllMocks();
    mockFail({ status: 500, body: { unexpected: true } });
    await expect(run({ action: aiListChats, propsValue: {} })).rejects.toThrow('(500): no error message returned');
  });

  it('non-HTTP errors propagate unchanged', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('ECONNRESET'));
    await expect(run({ action: aiListChats, propsValue: {} })).rejects.toThrow(/^ECONNRESET$/);
  });
});

describe('auth validate', () => {
  const validate = bushbulletAuth.validate;
  if (!validate) throw new Error('validate missing');
  const call = (auth: string) => Reflect.apply(validate, bushbulletAuth, [{ auth, server: {} }]);

  it('accepts a good token via GET /users/me', async () => {
    const spy = mockOk({ iden: 'u1' });
    expect(await call(TOKEN)).toEqual({ valid: true });
    expect(firstCall(spy)).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/users/me`, headers: HEADERS });
  });

  it('rejects a 401 with a clear message', async () => {
    mockFail({ status: 401, body: { error: { message: 'Access token is missing or invalid.' } } });
    expect(await call('bad')).toEqual({ valid: false, error: expect.stringContaining('Invalid access token') });
  });

  it('other errors return the vendor message', async () => {
    mockFail({ status: 500, body: { error: { message: 'boom' } } });
    expect(await call(TOKEN)).toEqual({ valid: false, error: 'Pushbullet API request failed (500): boom' });
  });
});
