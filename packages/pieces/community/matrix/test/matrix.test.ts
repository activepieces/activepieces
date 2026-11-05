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

function runAction({ name, propsValue = {}, connection = auth, runId = 'run1', stepName = 'step_1' }: { name: string; propsValue?: Record<string, unknown>; connection?: unknown; runId?: string; stepName?: string }) {
  return Reflect.apply(action(name).run, undefined, [{ auth: connection, propsValue, run: { id: runId }, step: { name: stepName } }]);
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
    expect(() => matrixIds.roomId('!a b:x.org')).toThrow();
    expect(matrixIds.roomAlias('#team/ops:x.org')).toBe('#team/ops:x.org');
    expect(matrixIds.userId('@team/bot:x.org')).toBe('@team/bot:x.org');
    expect(matrixIds.clientPath('directory', 'room', '#team/ops:x.org')).toBe('/_matrix/client/v3/directory/room/%23team%2Fops%3Ax.org');
    expect(() => matrixIds.userId('@alice')).toThrow();
    expect(() => matrixIds.roomAlias('#room')).toThrow();
    expect(() => matrixIds.eventId('abc')).toThrow();
    expect(() => matrixIds.roomIdOrAlias('room')).toThrow();
  });
  it('encodes every path segment', () => {
    expect(matrixIds.clientPath('rooms', '!a:b.org', 'event', '$e+/=')).toBe('/_matrix/client/v3/rooms/!a%3Ab.org/event/%24e%2B%2F%3D');
  });
  it('generates or validates transaction ids', () => {
    expect(matrixIds.transactionId(undefined)).toBeUndefined();
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
  it('reuses the txnId only to retry a failed send', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(httpFailure({ status: 502, body: {} }))
      .mockResolvedValue({ status: 200, headers: {}, body: { event_id: '$ev' } });
    const props = { room: '!r:x.org', message: 'retry-me' };
    await expect(runAction({ name: 'send_message', propsValue: props, runId: 'retry-run' })).rejects.toThrow();
    const retried = await runAction({ name: 'send_message', propsValue: props, runId: 'retry-run' });
    const failedUrl = spy.mock.calls.at(-2)?.[0].url;
    expect(spy.mock.calls.at(-1)?.[0].url).toBe(failedUrl);
    const next = await runAction({ name: 'send_message', propsValue: props, runId: 'retry-run' });
    expect(next.transactionId).not.toBe(retried.transactionId);
  });
});

describe('send_text_message repeats', () => {
  it('posts identical successful calls separately (loops, MCP)', async () => {
    mockOk({ event_id: '$ev' });
    const a = await runAction({ name: 'send_text_message', propsValue: { room: '!r:x.org', text: 'hi' }, runId: 'mcp-flow-run-id' });
    const b = await runAction({ name: 'send_text_message', propsValue: { room: '!r:x.org', text: 'hi' }, runId: 'mcp-flow-run-id' });
    expect(a.transactionId).toMatch(/^ap-[0-9a-f-]{36}$/);
    expect(b.transactionId).not.toBe(a.transactionId);
  });
  it('uses an explicit transactionId as given', async () => {
    mockOk({ event_id: '$ev' });
    const a = await runAction({ name: 'send_text_message', propsValue: { room: '!r:x.org', text: 'hi', transactionId: 'fixed-1' } });
    expect(a.transactionId).toBe('fixed-1');
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
    expect(spy.mock.calls[0][0].queryParams).toEqual({ dir: 'b', limit: '5', from: 'tok1', filter: '{"types":["m.room.message","m.room.encrypted"]}' });
    expect(out).toMatchObject({ count: 1, hasMore: true, nextToken: 'tok2', items: [{ eventId: '$1', body: 'b', timestamp: '1970-01-01T00:00:00.000Z' }] });
  });
});

describe('greptile fixes', () => {
  function routed(original: unknown) {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.url.endsWith('/account/whoami')) return { status: 200, headers: {}, body: { user_id: '@me:x.org' } };
      if (request.method === HttpMethod.GET) return { status: 200, headers: {}, body: original };
      return { status: 200, headers: {}, body: { event_id: '$edit' } };
    });
  }
  const mine = { event_id: '$e', type: 'm.room.message', sender: '@me:x.org', content: { msgtype: 'm.text', body: 'old' } };
  it('edit_message sends an m.replace for own messages', async () => {
    const spy = routed(mine);
    const out = await runAction({ name: 'edit_message', propsValue: { roomId: '!r:x.org', eventId: '$e', text: 'new', format: 'plain' } });
    expect(out).toMatchObject({ eventId: '$edit', editedEventId: '$e' });
    expect(spy.mock.calls.at(-1)?.[0].body).toMatchObject({ 'm.relates_to': { rel_type: 'm.replace', event_id: '$e' } });
  });
  it('edit_message keeps the original notice or emote message type', async () => {
    for (const msgtype of ['m.notice', 'm.emote']) {
      vi.restoreAllMocks();
      const spy = routed({ ...mine, content: { msgtype, body: 'old' } });
      await runAction({ name: 'edit_message', propsValue: { roomId: '!r:x.org', eventId: '$e', text: 'new', format: 'plain' } });
      const body = spy.mock.calls.at(-1)?.[0].body;
      expect(body).toMatchObject({ msgtype, 'm.new_content': { msgtype, body: 'new' } });
    }
  });
  it('edit_message refuses non-text messages such as images', async () => {
    const spy = routed({ ...mine, content: { msgtype: 'm.image', body: 'pic.png' } });
    await expect(runAction({ name: 'edit_message', propsValue: { roomId: '!r:x.org', eventId: '$e', text: 'new' } })).rejects.toThrow('only text, notice and emote');
    expect(spy.mock.calls.every((call) => call[0].method === HttpMethod.GET)).toBe(true);
  });
  it('edit_message refuses another sender, redacted or edit events', async () => {
    for (const { original, msg } of [
      { original: { ...mine, sender: '@other:x.org' }, msg: 'Only the original sender' },
      { original: { ...mine, unsigned: { redacted_because: {} } }, msg: 'was deleted' },
      { original: { ...mine, content: { body: '* x', 'm.relates_to': { rel_type: 'm.replace', event_id: '$o' } } }, msg: 'itself an edit' },
    ]) {
      vi.restoreAllMocks();
      const spy = routed(original);
      await expect(runAction({ name: 'edit_message', propsValue: { roomId: '!r:x.org', eventId: '$e', text: 'new' } })).rejects.toThrow(msg);
      expect(spy.mock.calls.every((call) => call[0].method === HttpMethod.GET)).toBe(true);
    }
  });
  it('keeps leading whitespace in message bodies but rejects blank text', async () => {
    const spy = mockOk({ event_id: '$ev' });
    await runAction({ name: 'send_text_message', propsValue: { room: '!r:x.org', text: '    code()', format: 'plain' } });
    expect(spy.mock.calls[0][0].body).toEqual({ msgtype: 'm.text', body: '    code()' });
    await expect(runAction({ name: 'send_text_message', propsValue: { room: '!r:x.org', text: '   ' } })).rejects.toThrow('Text is required');
  });
  it('fills roomId from the request when events omit it', async () => {
    mockOk({ event_id: '$e', type: 'm.room.message', sender: '@a:x.org', content: { body: 'b' } });
    await expect(runAction({ name: 'get_message', propsValue: { roomId: '!r:x.org', eventId: '$e' } })).resolves.toMatchObject({ roomId: '!r:x.org' });
    vi.restoreAllMocks();
    mockOk({ chunk: [{ event_id: '$1', type: 'm.room.message', content: { body: 'b' } }] });
    const out = await runAction({ name: 'list_messages', propsValue: { room: '!r:x.org' } });
    expect(out.items[0].roomId).toBe('!r:x.org');
  });
  it('join_room accepts bracketed IPv6 via servers', async () => {
    const spy = mockOk({ room_id: '!r:x.org' });
    await runAction({ name: 'join_room', propsValue: { room: '!r:x.org', via: ['[2001:db8::1]:8448', 'matrix.org'] } });
    expect(spy.mock.calls[0][0].url).toContain('via=%5B2001%3Adb8%3A%3A1%5D%3A8448&via=matrix.org');
    await expect(runAction({ name: 'join_room', propsValue: { room: '!r:x.org', via: ['bad/server'] } })).rejects.toThrow('Via servers');
  });
});

describe('create_room', () => {
  it('still returns roomId when the alias lookup fails', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { room_id: '!new:x.org' } })
      .mockRejectedValueOnce(httpFailure({ status: 404, body: { errcode: 'M_NOT_FOUND', error: 'none' } }));
    await expect(runAction({ name: 'create_room', propsValue: { aliasName: 'team-ops' } })).resolves.toEqual({ roomId: '!new:x.org', alias: null });
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
