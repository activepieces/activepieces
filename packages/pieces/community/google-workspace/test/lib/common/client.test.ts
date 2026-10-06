import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const network = vi.hoisted(() => ({ unexpectedCalls: 0 }));
const fetchMock = vi.hoisted(() =>
  vi.fn<(input: string | URL | Request, init?: RequestInit) => Promise<Response>>(async () => {
    network.unexpectedCalls++;
    throw new Error('Unexpected real network call');
  })
);
vi.stubGlobal('fetch', fetchMock);

const { HttpMethod } = await import('@activepieces/pieces-common');
const { GOOGLE_ADMIN_API_ROOT, GoogleWorkspaceApi, GoogleWorkspaceApiError, assertCustomApiCallUrl } = await import('../../../src/lib/common/client');

const TOKEN = 'ya29.test-token';
const AUTH = { access_token: TOKEN };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function answerWith(status: number, body: unknown): void {
  fetchMock.mockImplementation(async () => jsonResponse(status, body));
}

function sentUrl(call = 0): URL {
  return new URL(String(fetchMock.mock.calls[call]?.[0]));
}

function sentInit(call = 0): RequestInit {
  return fetchMock.mock.calls[call]?.[1] ?? {};
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
  expect(globalThis.fetch).toBe(fetchMock);
});

describe('GoogleWorkspaceApi', () => {
  describe('request()', () => {
    it('should call the Admin SDK root with the bearer token, a deadline and no empty query params', async () => {
      answerWith(200, { primaryEmail: 'jane@example.com' });

      const body = await GoogleWorkspaceApi.request({
        auth: AUTH,
        method: HttpMethod.GET,
        path: '/admin/directory/v1/users/jane%40example.com',
        query: { projection: 'full', customFieldMask: undefined, viewType: '' },
      });

      expect(body).toEqual({ primaryEmail: 'jane@example.com' });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0]?.[0])).toBe(`${GOOGLE_ADMIN_API_ROOT}/admin/directory/v1/users/jane%40example.com?projection=full`);
      const init = sentInit();
      expect(init.method).toBe('GET');
      expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' });
      expect(init.body).toBeUndefined();
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it('should send the body as JSON on writes and add no query string when there is none', async () => {
      answerWith(200, { id: '1' });

      await GoogleWorkspaceApi.request({
        auth: AUTH,
        method: HttpMethod.POST,
        path: 'admin/directory/v1/groups',
        body: { email: 'sales@example.com' },
      });

      expect(String(fetchMock.mock.calls[0]?.[0])).toBe(`${GOOGLE_ADMIN_API_ROOT}/admin/directory/v1/groups`);
      const init = sentInit();
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}`, Accept: 'application/json', 'Content-Type': 'application/json' });
      expect(JSON.parse(String(init.body))).toEqual({ email: 'sales@example.com' });
    });

    it('should encode numeric and boolean query values as strings', async () => {
      answerWith(200, { users: [] });

      await GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users', query: { maxResults: 50, showDeleted: false } });

      expect(Object.fromEntries(sentUrl().searchParams)).toEqual({ maxResults: '50', showDeleted: 'false' });
    });

    it('should resolve an empty object for a 204 or an empty success body', async () => {
      fetchMock.mockImplementationOnce(async () => new Response(null, { status: 204 }));
      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.DELETE, path: 'admin/directory/v1/users/1' })).resolves.toEqual({});

      fetchMock.mockImplementationOnce(async () => new Response('', { status: 200 }));
      await expect(
        GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.POST, path: 'admin/reports_v1/channels/stop', body: { id: 'c' } })
      ).resolves.toEqual({});
    });

    it('should reject a success body that is not JSON without echoing it', async () => {
      fetchMock.mockImplementationOnce(async () => new Response('not json at all', { status: 200 }));

      const failure = await GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users' }).catch((e: unknown) => e);

      expect(failure).toBeInstanceOf(GoogleWorkspaceApiError);
      expect((failure as Error).message).toBe('Google Workspace API returned 200 with a response that is not JSON.');
    });

    it('should turn a Google error body into a GoogleWorkspaceApiError with reason, message and hint', async () => {
      answerWith(404, {
        error: {
          code: 404,
          message: 'Resource Not Found: userKey',
          errors: [{ domain: 'global', reason: 'notFound', message: 'Resource Not Found: userKey' }],
        },
      });

      const failure = await GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users/x' }).catch(
        (e: unknown) => e
      );

      expect(failure).toBeInstanceOf(GoogleWorkspaceApiError);
      const error = failure as InstanceType<typeof GoogleWorkspaceApiError>;
      expect(error.status).toBe(404);
      expect(error.hasReason('notFound')).toBe(true);
      expect(error.errors).toEqual([{ reason: 'notFound', message: 'Resource Not Found: userKey', domain: 'global' }]);
      expect(error.message).toBe(
        'Google Workspace API returned 404: notFound: Resource Not Found: userKey Check the identifier: user and group keys are e-mails or ids, org units are paths, devices use their resource id.'
      );
      expect(error.cause).toBeUndefined();
    });

    it('should tell the user to enable the Admin SDK API on accessNotConfigured', async () => {
      answerWith(403, {
        error: {
          code: 403,
          status: 'PERMISSION_DENIED',
          message: 'Admin SDK API has not been used in project 123 before or it is disabled.',
          errors: [{ reason: 'accessNotConfigured', message: 'Access Not Configured.' }],
        },
      });

      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users' })).rejects.toThrow(
        'Google Workspace API returned 403 (PERMISSION_DENIED): accessNotConfigured: Access Not Configured. Enable the Admin SDK API'
      );
    });

    it('should fall back to the raw body when Google sends no structured error', async () => {
      answerWith(502, 'Bad Gateway');

      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users' })).rejects.toThrow(
        'Google Workspace API returned 502: Bad Gateway'
      );
    });

    it('should summarize an HTML error page instead of dumping it', async () => {
      answerWith(
        404,
        '<!DOCTYPE html>\n<html lang=en><title>Error 404 (Not Found)!!1</title><p>The requested URL <code>/admin/directory/v1/users/</code> was not found on this server.</p></html>'
      );

      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users/' })).rejects.toThrow(
        'Google Workspace API returned 404: Error 404 (Not Found)!!1 for /admin/directory/v1/users/ (the request URL is malformed, usually an empty identifier). Check the identifier'
      );
    });

    it('should report a network failure or timeout by its name only, without the request or a cause', async () => {
      fetchMock.mockImplementationOnce(async (_input, init) => {
        throw new TypeError('fetch failed', { cause: new Error(String(init?.body)) });
      });

      const failure = await GoogleWorkspaceApi.request({
        auth: AUTH,
        method: HttpMethod.POST,
        path: 'admin/directory/v1/users',
        body: { password: 'S3cret-network!' },
      }).catch((e: unknown) => e);

      expect(failure).toBeInstanceOf(Error);
      const error = failure as Error;
      expect(error.message).toBe('Could not reach the Google Workspace API (TypeError). Try again in a moment.');
      expect(error.cause).toBeUndefined();
      expect(`${error.message} ${error.stack ?? ''}`).not.toContain('S3cret-network!');

      fetchMock.mockImplementationOnce(async () => {
        throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      });
      await expect(GoogleWorkspaceApi.request({ auth: AUTH, method: HttpMethod.GET, path: 'admin/directory/v1/users' })).rejects.toThrow(
        'Could not reach the Google Workspace API (TimeoutError). Try again in a moment.'
      );
    });
  });

  describe('listPage()', () => {
    it('should read the collection array by its key and the next page token', async () => {
      answerWith(200, { kind: 'admin#directory#users', users: [{ id: '1' }], nextPageToken: 'p2' });

      const page = await GoogleWorkspaceApi.listPage({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: { customer: 'my_customer' } });

      expect(page).toEqual({ items: [{ id: '1' }], nextPageToken: 'p2' });
      expect(Object.fromEntries(sentUrl().searchParams)).toEqual({ customer: 'my_customer' });
    });

    it('should return an empty list when the collection key is absent', async () => {
      answerWith(200, { kind: 'admin#directory#groups' });

      await expect(GoogleWorkspaceApi.listPage({ auth: AUTH, path: 'admin/directory/v1/groups', itemsKey: 'groups' })).resolves.toEqual({ items: [] });
    });
  });

  describe('listAll()', () => {
    it('should follow nextPageToken until exhausted', async () => {
      fetchMock
        .mockImplementationOnce(async () => jsonResponse(200, { users: [{ id: '1' }, { id: '2' }], nextPageToken: 'p2' }))
        .mockImplementationOnce(async () => jsonResponse(200, { users: [{ id: '3' }] }));

      const { items, truncated } = await GoogleWorkspaceApi.listAll({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: { customer: 'my_customer' } });

      expect(items).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
      expect(truncated).toBe(false);
      expect(Object.fromEntries(sentUrl(1).searchParams)).toEqual({ customer: 'my_customer', pageToken: 'p2' });
    });

    it('should stop at maxRows and flag the result as truncated', async () => {
      answerWith(200, { users: [{ id: '1' }, { id: '2' }, { id: '3' }], nextPageToken: 'more' });

      const { items, truncated } = await GoogleWorkspaceApi.listAll({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: {}, maxRows: 2 });

      expect(items).toEqual([{ id: '1' }, { id: '2' }]);
      expect(truncated).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should not fetch another page once a full page reaches maxRows', async () => {
      fetchMock.mockImplementationOnce(async () => jsonResponse(200, { users: [{ id: '1' }, { id: '2' }], nextPageToken: 'more' }));

      const { items, truncated } = await GoogleWorkspaceApi.listAll({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: {}, maxRows: 2 });

      expect(items).toEqual([{ id: '1' }, { id: '2' }]);
      expect(truncated).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should report a complete result when the last page lands exactly on maxRows', async () => {
      fetchMock.mockImplementationOnce(async () => jsonResponse(200, { users: [{ id: '1' }, { id: '2' }] }));

      const { items, truncated } = await GoogleWorkspaceApi.listAll({ auth: AUTH, path: 'admin/directory/v1/users', itemsKey: 'users', query: {}, maxRows: 2 });

      expect(items).toHaveLength(2);
      expect(truncated).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('assertCustomApiCallUrl()', () => {
  it('should allow relative paths and full URLs on the Admin SDK host', () => {
    expect(() => assertCustomApiCallUrl({ url: { url: '/admin/directory/v1/users' } })).not.toThrow();
    expect(() => assertCustomApiCallUrl({ url: { url: 'admin/reports/v1/activity/users/all/applications/login' } })).not.toThrow();
    expect(() => assertCustomApiCallUrl({ url: { url: 'https://admin.googleapis.com/admin/directory/v1/users' } })).not.toThrow();
    expect(() => assertCustomApiCallUrl({})).not.toThrow();
  });

  it('should refuse a full URL on another host before the token is attached', () => {
    expect(() => assertCustomApiCallUrl({ url: { url: 'https://attacker.example.com/collect' } })).toThrow(
      'Custom API Call only sends the Google Workspace credentials to https://admin.googleapis.com, not to https://attacker.example.com.'
    );
    expect(() => assertCustomApiCallUrl({ url: { url: 'https://admin.googleapis.com.attacker.example.com/x' } })).toThrow('not to');
    expect(() => assertCustomApiCallUrl({ url: { url: 'https://www.googleapis.com/drive/v3/files' } })).toThrow('not to');
    expect(() => assertCustomApiCallUrl({ url: { url: 'http://admin.googleapis.com/admin/directory/v1/users' } })).toThrow('not to');
  });

  it('should refuse a full URL that cannot be parsed', () => {
    expect(() => assertCustomApiCallUrl({ url: { url: 'https://' } })).toThrow('is not valid');
  });
});
