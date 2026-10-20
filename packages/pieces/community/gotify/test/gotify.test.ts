import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gotify } from '../src';
import { GotifyApiError, gotifyClient } from '../src/lib/common/client';

const auth = { props: { base_url: 'https://gotify.example.com/', app_token: 'app-secret', client_token: 'client-secret' } };

function action(name: string) {
  const found = gotify.actions()[name];
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function mockResponse(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

function runAction({ name, propsValue = {}, connection = auth }: { name: string; propsValue?: Record<string, unknown>; connection?: unknown }) {
  const context = { auth: connection, propsValue };
  return Reflect.apply(action(name).run, undefined, [context]);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizeBaseUrl', () => {
  it('strips trailing slashes and keeps a subpath', () => {
    expect(gotifyClient.normalizeBaseUrl('https://h.example.com/gotify///')).toBe('https://h.example.com/gotify');
    expect(gotifyClient.normalizeBaseUrl(' http://localhost:8081/ ')).toBe('http://localhost:8081');
  });
  it.each([
    'ftp://h.example.com',
    'https://user:pw@h.example.com',
    'https://h.example.com/?token=x',
    'https://h.example.com/#x',
    'h.example.com',
    '',
  ])('rejects %s', (value) => {
    expect(() => gotifyClient.normalizeBaseUrl(value)).toThrow();
  });
});

describe('isSameOrigin', () => {
  it('rejects lookalike hosts and other prefixes', () => {
    const baseUrl = 'https://gotify.example.com/g';
    expect(gotifyClient.isSameOrigin({ url: 'https://gotify.example.com/g/message', baseUrl })).toBe(true);
    expect(gotifyClient.isSameOrigin({ url: 'https://gotify.example.com.evil.io/g/message', baseUrl })).toBe(false);
    expect(gotifyClient.isSameOrigin({ url: 'https://gotify.example.com/other', baseUrl })).toBe(false);
    expect(gotifyClient.isSameOrigin({ url: 'https://x@gotify.example.com/g', baseUrl })).toBe(false);
  });
});

describe('parseId', () => {
  it('accepts numeric strings and rejects others', () => {
    expect(gotifyClient.parseId({ value: ' 12 ', label: 'ID' })).toBe(12);
    expect(() => gotifyClient.parseId({ value: '1/../x', label: 'ID' })).toThrow();
    expect(() => gotifyClient.parseId({ value: '0', label: 'ID' })).toThrow();
  });
});

describe('send_notification', () => {
  it('sends the token in a header, keeps priority 0 and builds extras', async () => {
    const spy = mockResponse({ id: 1, appid: 1, message: 'm', title: 't', priority: 0, date: '2026-10-14T00:00:00Z' });
    const result = await runAction({ name: 'send_notification', propsValue: {
      title: 't',
      message: 'm',
      priority: 0,
      markdown: true,
      click_url: 'https://example.com',
    } });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://gotify.example.com/message');
    expect(request.url).not.toContain('app-secret');
    expect(request.headers).toMatchObject({ 'x-gotify-key': 'app-secret' });
    expect(request.body).toEqual({
      title: 't',
      message: 'm',
      priority: 0,
      extras: { 'client::display': { contentType: 'text/markdown' }, 'client::notification': { click: { url: 'https://example.com' } } },
    });
    expect(result).toEqual({ id: 1, appid: 1, message: 'm', title: 't', priority: 0, date: '2026-10-14T00:00:00Z' });
  });
  it('omits priority when empty and rejects out of range', async () => {
    const spy = mockResponse({ id: 2 });
    await runAction({ name: 'send_notification', propsValue: { title: 't', message: 'm' } });
    expect(spy.mock.calls[0][0].body).toEqual({ title: 't', message: 'm' });
    await expect(runAction({ name: 'send_notification', propsValue: { title: 't', message: 'm', priority: 11 } })).rejects.toThrow('Priority');
  });
  it('rejects a non-http click url', async () => {
    mockResponse({});
    await expect(runAction({ name: 'send_notification', propsValue: { title: 't', message: 'm', click_url: 'javascript:alert(1)' } })).rejects.toThrow('Click URL');
  });
});

describe('error mapping', () => {
  it('maps a 401 to GotifyApiError with responseBody', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue({
      response: { status: 401, body: { error: 'Unauthorized', errorCode: 401, errorDescription: 'bad token' } },
    });
    const error = await runAction({ name: 'get_current_user' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GotifyApiError);
    expect(error).toMatchObject({ status: 401, responseBody: { errorDescription: 'bad token' } });
  });
  it('needs a client token for read actions', async () => {
    const spy = mockResponse({});
    await expect(runAction({ name: 'list_clients', connection: { props: { ...auth.props, client_token: undefined } } })).rejects.toThrow('Client Token');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('list_messages', () => {
  it('uses the application path and returns paging', async () => {
    const spy = mockResponse({ paging: { next: 'https://x/next', since: 5, size: 1, limit: 1 }, messages: [{ id: 5 }] });
    const result = await runAction({ name: 'list_messages', propsValue: { applicationId: '3', limit: 1, since: 9 } });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://gotify.example.com/application/3/message');
    expect(request.queryParams).toEqual({ limit: '1', since: '9' });
    expect(request.headers).toMatchObject({ 'x-gotify-key': 'client-secret' });
    expect(result).toEqual({ messages: [{ id: 5 }], count: 1, hasMore: true, nextSince: 5 });
  });
  it('reports no more pages without next', async () => {
    mockResponse({ paging: { since: 0, size: 0, limit: 100 }, messages: [] });
    expect(await runAction({ name: 'list_messages' })).toEqual({ messages: [], count: 0, hasMore: false, nextSince: null });
  });
});

describe('token projection', () => {
  it('removes tokens from applications and clients', async () => {
    mockResponse([{ id: 1, name: 'a', token: 'secret' }]);
    expect(await runAction({ name: 'list_applications' })).toEqual({ applications: [{ id: 1, name: 'a' }], count: 1 });
    vi.restoreAllMocks();
    mockResponse([{ id: 1, name: 'c', token: 'secret' }]);
    expect(await runAction({ name: 'list_clients' })).toEqual({ clients: [{ id: 1, name: 'c' }], count: 1 });
  });
});

describe('deletes', () => {
  it('treats 404 on delete_message as already deleted', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue({ response: { status: 404, body: { error: 'Not Found' } } });
    expect(await runAction({ name: 'delete_message', propsValue: { messageId: '7' } })).toEqual({ id: 7, deleted: false, alreadyDeleted: true });
  });
  it('rethrows other errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue({ response: { status: 500, body: 'boom' } });
    await expect(runAction({ name: 'delete_application', propsValue: { applicationId: '7' } })).rejects.toBeInstanceOf(GotifyApiError);
  });
});

describe('update_application', () => {
  it('merges current values into the PUT body', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: [{ id: 4, name: 'old', description: 'd', defaultPriority: 5, token: 't' }] })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 4, name: 'new', description: 'd', defaultPriority: 5, token: 't' } });
    const result = await runAction({ name: 'update_application', propsValue: { applicationId: '4', name: 'new' } });
    expect(spy.mock.calls[1][0].body).toEqual({ name: 'new', description: 'd', defaultPriority: 5 });
    expect(result).toEqual({ id: 4, name: 'new', description: 'd', defaultPriority: 5 });
  });
  it('refuses an empty update', async () => {
    const spy = mockResponse([]);
    await expect(runAction({ name: 'update_application', propsValue: { applicationId: '4' } })).rejects.toThrow('at least one');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('get_server_health', () => {
  it('returns the unhealthy status when /health answers 500', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce({ response: { status: 500, body: { health: 'orange', database: 'red' } } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { version: '2.6.1', commit: 'abc', buildDate: '2024' } });
    const result = await runAction({ name: 'get_server_health' });
    expect(result).toEqual({ health: 'orange', database: 'red', version: '2.6.1', commit: 'abc', buildDate: '2024' });
  });

  it('still throws on other errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue({ response: { status: 502, body: 'bad gateway' } });
    await expect(runAction({ name: 'get_server_health' })).rejects.toBeInstanceOf(GotifyApiError);
  });
});

describe('auth validate', () => {
  it('rejects an app token not owned by the client user', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { health: 'green', database: 'green' } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: [{ id: 1, token: 'other' }] });
    const validate = gotify.auth?.validate;
    if (!validate) throw new Error('no validate');
    const result = await Reflect.apply(validate, undefined, [{ auth: auth.props }]);
    expect(result).toMatchObject({ valid: false });
  });
});

describe('custom_api_call', () => {
  it('sends with the Client Token through the verifying TLS dispatcher', async () => {
    const spy = mockResponse({ ok: true });
    const result = await runAction({
      name: 'custom_api_call',
      propsValue: { path: '/application', method: 'POST', queryParams: { a: 1 }, body: { name: 'x' } },
    });
    const [request, options] = spy.mock.calls[0];
    expect(request.url).toBe('https://gotify.example.com/application');
    expect(request.headers).toMatchObject({ 'x-gotify-key': 'client-secret' });
    expect(request.queryParams).toEqual({ a: '1' });
    expect(request.body).toEqual({ name: 'x' });
    expect(request.followRedirects).toBe(false);
    expect(options?.dispatcher).toBeDefined();
    expect(result).toEqual({ body: { ok: true } });
  });
  it('drops the body on GET', async () => {
    const spy = mockResponse([]);
    await runAction({ name: 'custom_api_call', propsValue: { path: '/message', method: 'GET', body: { x: 1 } } });
    expect(spy.mock.calls[0][0].body).toBeUndefined();
  });
  it.each(['https://evil.example.com/x', '//evil.example.com/x', 'message', '/a/../b', '/a/%2e%2e/b', '/a?token=x', '/a\\b'])(
    'rejects path %s before any request',
    async (path) => {
      const spy = mockResponse({});
      await expect(runAction({ name: 'custom_api_call', propsValue: { path, method: 'GET' } })).rejects.toThrow();
      expect(spy).not.toHaveBeenCalled();
    },
  );
});
