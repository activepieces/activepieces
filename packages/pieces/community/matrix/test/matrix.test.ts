import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { matrix } from '../src';
import { MatrixApiError, matrixClient } from '../src/lib/common/client';
import { matrixIds } from '../src/lib/common/ids';
import { matrixMarkdown } from '../src/lib/common/markdown';

const auth = { props: { base_url: 'https://matrix.example.org/', access_token: 'secret-token' } };

function action(name: string) {
  const found = matrix.actions()[name];
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function runAction({ name, propsValue = {}, connection = auth }: { name: string; propsValue?: Record<string, unknown>; connection?: unknown }) {
  return Reflect.apply(action(name).run, undefined, [{ auth: connection, propsValue }]);
}

function mockOk(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

function httpFailure({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error('http'), { response: { status, body, headers: {} } });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('normalizeHomeserver', () => {
  it('adds https and strips trailing slashes', () => {
    expect(matrixClient.normalizeHomeserver('matrix.org')).toBe('https://matrix.org');
    expect(matrixClient.normalizeHomeserver(' https://h.example.org/// ')).toBe('https://h.example.org');
    expect(matrixClient.normalizeHomeserver('http://localhost:8008')).toBe('http://localhost:8008');
  });
  it.each([
    'http://matrix.org',
    'ftp://matrix.org',
    'https://u:p@matrix.org',
    'https://matrix.org/?x=1',
    'https://matrix.org/#x',
    'https://matrix.org/a/../b',
    '',
  ])('rejects %s', (value) => {
    expect(() => matrixClient.normalizeHomeserver(value)).toThrow();
  });
  it('explains an Element web link', () => {
    expect(() => matrixClient.normalizeHomeserver('https://app.element.io/#/home')).toThrow(/web app link/);
  });
});

describe('ids', () => {
  it('validates sigils', () => {
    expect(matrixIds.roomId('!abc:x.org')).toBe('!abc:x.org');
    expect(matrixIds.roomId('!opaqueV12id')).toBe('!opaqueV12id');
    expect(() => matrixIds.roomId('#a:x.org')).toThrow();
    expect(() => matrixIds.roomId('!a/../b')).toThrow();
    expect(() => matrixIds.userId('@alice')).toThrow();
    expect(() => matrixIds.roomAlias('#room')).toThrow();
    expect(() => matrixIds.eventId('abc')).toThrow();
    expect(() => matrixIds.roomIdOrAlias('room')).toThrow();
  });
  it('encodes every path segment', () => {
    expect(matrixIds.clientPath('rooms', '!a:b.org', 'event', '$e+/=')).toBe('/_matrix/client/v3/rooms/!a%3Ab.org/event/%24e%2B%2F%3D');
  });
  it('generates or validates transaction ids', () => {
    expect(matrixIds.transactionId(undefined)).toMatch(/^ap-[0-9a-f-]{36}$/);
    expect(matrixIds.transactionId('retry-1')).toBe('retry-1');
    expect(() => matrixIds.transactionId('a/b')).toThrow();
  });
});

describe('markdown', () => {
  it('escapes raw html and drops unsafe links', async () => {
    const html = await matrixMarkdown.toSafeHtml('**hi** <img src=x onerror=alert(1)> [x](javascript:alert(1)) [ok](https://a.org)');
    expect(html).toContain('<strong>hi</strong>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('<a href="https://a.org">ok</a>');
  });
});

describe('request errors', () => {
  it('maps errcode into a MatrixApiError with responseBody', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpFailure({ status: 403, body: { errcode: 'M_FORBIDDEN', error: 'nope' } }));
    const error = await runAction({ name: 'get_current_user' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MatrixApiError);
    expect(error).toMatchObject({ status: 403, errcode: 'M_FORBIDDEN', responseBody: { errcode: 'M_FORBIDDEN', error: 'nope' } });
  });
  it('does not double the vendor full stop', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpFailure({ status: 403, body: { errcode: 'M_FORBIDDEN', error: 'x is already in the room.' } }));
    await expect(runAction({ name: 'get_current_user' })).rejects.toThrow('Matrix API error (403 M_FORBIDDEN): x is already in the room. Check');
  });
  it('retries M_LIMIT_EXCEEDED with a clamped wait', async () => {
    vi.useFakeTimers();
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(httpFailure({ status: 429, body: { errcode: 'M_LIMIT_EXCEEDED', retry_after_ms: 999999 } }))
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { user_id: '@me:x.org' } });
    const pending = runAction({ name: 'get_current_user' });
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(pending).resolves.toMatchObject({ userId: '@me:x.org' });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(matrixClient.retryWaitMs({ body: { retry_after_ms: 999999 }, headers: {} })).toBe(30_000);
  });
});

describe('send_text_message', () => {
  it('PUTs with txnId, bearer token and sanitized html', async () => {
    const spy = mockOk({ event_id: '$ev' });
    const out = await runAction({
      name: 'send_text_message',
      propsValue: { room: '!r:x.org', text: 'hi <b>x</b>', transactionId: 't1', replyToEventId: '$p' },
    });
    expect(out).toEqual({ eventId: '$ev', roomId: '!r:x.org', transactionId: 't1' });
    const request = spy.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.PUT);
    expect(request.url).toBe('https://matrix.example.org/_matrix/client/v3/rooms/!r%3Ax.org/send/m.room.message/t1');
    expect(request.headers).toMatchObject({ authorization: 'Bearer secret-token' });
    expect(request.followRedirects).toBe(false);
    expect(request.body).toMatchObject({
      msgtype: 'm.text',
      body: 'hi <b>x</b>',
      format: 'org.matrix.custom.html',
      'm.relates_to': { 'm.in_reply_to': { event_id: '$p' } },
    });
    expect(request.body.formatted_body).toBe('<p>hi &lt;b&gt;x&lt;/b&gt;</p>');
  });
  it('resolves an alias first and sends plain text', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { room_id: '!r:x.org', servers: [] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { event_id: '$ev' } });
    await runAction({ name: 'send_text_message', propsValue: { room: '#room:x.org', text: 'hello', format: 'plain', msgtype: 'm.notice' } });
    expect(spy.mock.calls[0][0].url).toBe('https://matrix.example.org/_matrix/client/v3/directory/room/%23room%3Ax.org');
    expect(spy.mock.calls[1][0].body).toEqual({ msgtype: 'm.notice', body: 'hello' });
  });
  it('rejects a bad room before any request', async () => {
    const spy = mockOk({});
    await expect(runAction({ name: 'send_text_message', propsValue: { room: 'general', text: 'x' } })).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('send_message (human)', () => {
  it('needs a room or an alias', async () => {
    await expect(runAction({ name: 'send_message', propsValue: { message: 'x' } })).rejects.toThrow('Pick a Room');
  });
  it('returns only event and room ids, not the http response', async () => {
    mockOk({ event_id: '$ev' });
    const out = await runAction({ name: 'send_message', propsValue: { room: '!r:x.org', message: 'x' } });
    expect(Object.keys(out).sort()).toEqual(['eventId', 'roomId', 'transactionId']);
  });
});

describe('react_to_message', () => {
  it('treats a duplicate annotation as already reacted', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpFailure({ status: 400, body: { errcode: 'M_DUPLICATE_ANNOTATION', error: 'dup' } }));
    await expect(runAction({ name: 'react_to_message', propsValue: { roomId: '!r:x.org', eventId: '$e', key: '👍' } })).resolves.toMatchObject({
      alreadyReacted: true,
      eventId: null,
    });
  });
});

describe('list_messages', () => {
  it('sends dir, limit, from and the message filter', async () => {
    const spy = mockOk({ chunk: [{ event_id: '$1', type: 'm.room.message', sender: '@a:x.org', origin_server_ts: 0, content: { msgtype: 'm.text', body: 'b' } }], end: 'tok2' });
    const out = await runAction({ name: 'list_messages', propsValue: { room: '!r:x.org', limit: 5, from: 'tok1' } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ dir: 'b', limit: '5', from: 'tok1', filter: '{"types":["m.room.message"]}' });
    expect(out).toMatchObject({ count: 1, hasMore: true, nextToken: 'tok2', items: [{ eventId: '$1', body: 'b', timestamp: '1970-01-01T00:00:00.000Z' }] });
  });
});

describe('auth.validate', () => {
  const validate = matrix.auth?.validate;
  it('accepts a working token', async () => {
    mockOk({ user_id: '@me:x.org' });
    expect(await validate?.({ auth: auth.props, server: { apiUrl: '', publicUrl: '' } })).toEqual({ valid: true });
  });
  it('reports an invalid token on 401', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpFailure({ status: 401, body: { errcode: 'M_UNKNOWN_TOKEN', error: 'x' } }));
    expect(await validate?.({ auth: auth.props, server: { apiUrl: '', publicUrl: '' } })).toEqual({ valid: false, error: 'Invalid access token.' });
  });
  it('rejects a non-homeserver URL before any request', async () => {
    const spy = mockOk({});
    const result = await validate?.({ auth: { ...auth.props, base_url: 'https://app.element.io/#/home' }, server: { apiUrl: '', publicUrl: '' } });
    expect(result).toMatchObject({ valid: false });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('metadata', () => {
  it('has exactly one agent-visible send action and schemas everywhere', () => {
    const actions = Object.values(matrix.actions());
    const ai = actions.filter((a) => a.audience === 'ai' || a.audience === 'both').map((a) => a.name);
    expect(ai.filter((name) => name.startsWith('send'))).toEqual(['send_text_message']);
    expect(action('send_message').audience).toBe('human');
    for (const a of actions) {
      if (a.name === 'custom_api_call') continue;
      expect(a.outputSchema, a.name).toBeDefined();
    }
  });
});
