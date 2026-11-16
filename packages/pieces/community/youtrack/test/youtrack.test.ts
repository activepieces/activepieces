import { Readable } from 'node:stream';
import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { youtrack } from '../src/index';
import { youtrackAuth } from '../src/lib/auth';
import { YoutrackApiError, youtrackClient } from '../src/lib/common/client';
import { createIssueAction } from '../src/lib/actions/create-issue';
import { getIssueAction } from '../src/lib/actions/get-issue';
import { searchIssuesAction } from '../src/lib/actions/search-issues';
import { updateIssueAction } from '../src/lib/actions/update-issue';
import { applyCommandAction } from '../src/lib/actions/apply-command';
import { uploadAttachmentAction } from '../src/lib/actions/upload-attachment';
import { downloadAttachmentAction } from '../src/lib/actions/download-attachment';
import { getIssueHistoryAction } from '../src/lib/actions/get-issue-history';
import { linkIssuesAction } from '../src/lib/actions/link-issues';
import { listTagsAction } from '../src/lib/actions/list-tags';
import { deleteAttachmentAction } from '../src/lib/actions/delete-attachment';
import { removeTagFromIssueAction } from '../src/lib/actions/remove-tag-from-issue';
import { listProjectsAction } from '../src/lib/actions/list-projects';
import { getProjectAction } from '../src/lib/actions/get-project';
import { listProjectCustomFieldsAction } from '../src/lib/actions/list-project-custom-fields';
import { findUsersAction } from '../src/lib/actions/find-users';
import { getCurrentUserAction } from '../src/lib/actions/get-current-user';
import { listGroupsAction } from '../src/lib/actions/list-groups';
import { listAgileBoardsAction } from '../src/lib/actions/list-agile-boards';
import { listSprintsAction } from '../src/lib/actions/list-sprints';
import { createSprintAction } from '../src/lib/actions/create-sprint';
import { addIssueToSprintAction } from '../src/lib/actions/add-issue-to-sprint';
import { listLinkTypesAction } from '../src/lib/actions/list-link-types';
import { getIssueLinksAction } from '../src/lib/actions/get-issue-links';
import { findWorkItemsAction } from '../src/lib/actions/find-work-items';
import { addWorkItemAction } from '../src/lib/actions/add-work-item';
import { deleteWorkItemAction } from '../src/lib/actions/delete-work-item';
import { searchArticlesAction } from '../src/lib/actions/search-articles';
import { getArticleAction } from '../src/lib/actions/get-article';
import { createArticleAction } from '../src/lib/actions/create-article';
import { updateArticleAction } from '../src/lib/actions/update-article';
import { listSavedSearchesAction } from '../src/lib/actions/list-saved-searches';
import { deleteIssueAction } from '../src/lib/actions/delete-issue';
import { updateCommentAction } from '../src/lib/actions/update-comment';
import { deleteCommentAction } from '../src/lib/actions/delete-comment';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { baseUrl: ' example.youtrack.cloud/api/ ', apiToken: ' perm:abc ' },
};
const BASE = 'https://example.youtrack.cloud/api';

function ok(body: unknown) {
  sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function httpError({ status, body, requestBody }: { status: number; body: unknown; requestBody?: unknown }) {
  return new HttpError(requestBody ?? {}, { status, responseBody: body });
}

function call<T>({ fn, propsValue }: { fn: (ctx: never) => Promise<T>; propsValue: Record<string, unknown> }): Promise<T> {
  return Reflect.apply(fn, undefined, [{ auth: AUTH, propsValue }]);
}

function req(index: number) {
  return sendRequest.mock.calls[index][0];
}

function validate({ baseUrl, apiToken }: { baseUrl: string; apiToken: string }) {
  return youtrackAuth.validate?.({
    auth: { baseUrl, apiToken },
    server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => 'x' },
  });
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('base URL normalisation', () => {
  it('adds https:// to a bare host and strips trailing slashes and /api', () => {
    expect(youtrackClient.normalizeBaseUrl('example.youtrack.cloud')).toBe('https://example.youtrack.cloud');
    expect(youtrackClient.normalizeBaseUrl(' https://example.youtrack.cloud/api/ ')).toBe('https://example.youtrack.cloud');
    expect(youtrackClient.normalizeBaseUrl('https://host.example.com/youtrack/')).toBe('https://host.example.com/youtrack');
    expect(youtrackClient.normalizeBaseUrl('https://host.example.com/youtrack/api')).toBe('https://host.example.com/youtrack');
    expect(youtrackClient.normalizeBaseUrl('http://localhost:8080')).toBe('http://localhost:8080');
    expect(youtrackClient.normalizeBaseUrl('host.example.com:8443/youtrack')).toBe('https://host.example.com:8443/youtrack');
  });

  it('checkBaseUrl refuses what is still invalid', () => {
    expect(youtrackClient.checkBaseUrl('not a url').ok).toBe(false);
    expect(youtrackClient.checkBaseUrl('ftp://x.example.com').ok).toBe(false);
    expect(youtrackClient.checkBaseUrl('https://user:pw@x.example.com').ok).toBe(false);
    expect(youtrackClient.checkBaseUrl('https://x.example.com?a=1').ok).toBe(false);
    expect(youtrackClient.checkBaseUrl('').ok).toBe(false);
    expect(youtrackClient.checkBaseUrl('example.youtrack.cloud')).toEqual({ ok: true, baseUrl: 'https://example.youtrack.cloud' });
  });

  it('turns an unparseable saved URL into a clear message, not "Invalid URL"', async () => {
    await expect(
      Reflect.apply(getIssueAction.run, undefined, [{ auth: { props: { baseUrl: 'bad host', apiToken: 'perm:x' } }, propsValue: { issue: '2-1' } }])
    ).rejects.toThrow('Instance URL "bad host" of the YouTrack connection is not a valid URL');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('client', () => {
  it('sends the trimmed token, Accept JSON, verified-TLS dispatcher, no redirects, no retries, redacted bodies and a timeout', async () => {
    ok({ id: '2-1' });
    await call({ fn: getIssueAction.run, propsValue: { issue: 'APT/5?x' } });
    const [request, options] = sendRequest.mock.calls[0];
    expect(request.url).toBe(`${BASE}/issues/APT%2F5%3Fx`);
    expect(request.headers).toMatchObject({ Authorization: 'Bearer perm:abc', Accept: 'application/json' });
    expect(request.followRedirects).toBe(false);
    expect(request.redactBodyInErrors).toBe(true);
    expect(request.retries).toBe(0);
    expect(request.timeout).toBe(60000);
    expect(options.dispatcher.constructor.name).toBe('Agent');
  });

  it('refuses dot segments in ids', async () => {
    await expect(call({ fn: getIssueAction.run, propsValue: { issue: '..' } })).rejects.toThrow('Issue is required');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('surfaces error_description with status and responseBody, never body or the request body', async () => {
    const vendor = { error: 'bad_request', error_description: 'Unknown field Foo' };
    sendRequest.mockRejectedValueOnce(httpError({ status: 400, body: vendor, requestBody: 'SECRET-REQUEST-BODY' }));
    const error = await call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(YoutrackApiError);
    expect(error).toMatchObject({ status: 400, responseBody: vendor });
    expect(error).not.toHaveProperty('body');
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('YouTrack could not read the issue (HTTP 400): Unknown field Foo (bad_request)');
    expect(message).not.toContain('SECRET-REQUEST-BODY');
  });

  it('adds a token hint on 401 and 403 only', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: { error: 'Unauthorized' } }));
    await expect(call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } })).rejects.toThrow('Check the permanent token');
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: { error: 'Not Found' } }));
    const error = await call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } }).catch((e: unknown) => e);
    expect(error instanceof Error ? error.message : '').not.toContain('permanent token');
  });

  it('treats a redirect as an error naming the Instance URL', async () => {
    sendRequest.mockResolvedValueOnce({ status: 301, headers: { location: 'https://other.example/api/issues/2-1' }, body: undefined });
    await expect(call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } })).rejects.toThrow('answered with a redirect to https://other.example');
    sendRequest.mockResolvedValueOnce({ status: 302, headers: { location: 'https://cdn.example.net/f/1?sign=SECRET#x' }, body: undefined });
    const error = await call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } }).catch((e: unknown) => e);
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('redirect to https://cdn.example.net/f/1.');
    expect(message).not.toContain('SECRET');
  });

  it('reports a timeout and a certificate failure by name', async () => {
    sendRequest.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await expect(call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } })).rejects.toThrow('timed out after 60 s');
    sendRequest.mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'SELF_SIGNED_CERT_IN_CHAIN' } }));
    await expect(call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } })).rejects.toThrow('self-signed, expired or not trusted');
    sendRequest.mockRejectedValueOnce(new TypeError('getaddrinfo ENOTFOUND example.youtrack.cloud'));
    await expect(call({ fn: getIssueAction.run, propsValue: { issue: '2-1' } })).rejects.toThrow('could not reach https://example.youtrack.cloud');
  });

  it('listAll returns a result of exactly maxItems after probing for one more entry', async () => {
    ok(Array.from({ length: 100 }, (_, i) => ({ id: `t${i}` })));
    ok(Array.from({ length: 100 }, (_, i) => ({ id: `u${i}` })));
    ok([]);
    const out = await youtrackClient.listAll({ auth: AUTH, path: '/tags', query: { fields: 'id' }, maxItems: 200, operation: 'list tags' });
    expect(out).toHaveLength(200);
    expect(req(2).queryParams).toMatchObject({ $top: '1', $skip: '200' });
  });

  it('listAll throws at the cap instead of truncating', async () => {
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: Array.from({ length: 100 }, (_, i) => ({ id: `t${i}` })) });
    await expect(
      youtrackClient.listAll({ auth: AUTH, path: '/tags', query: { fields: 'id' }, maxItems: 200, operation: 'list tags' })
    ).rejects.toThrow('more than 200');
    expect(req(1).queryParams).toMatchObject({ $top: '100', $skip: '100' });
  });
});

describe('auth validate', () => {
  it('accepts a good token and calls /api/users/me on the normalised URL', async () => {
    ok({ id: '1-1', login: 'admin' });
    expect(await validate({ baseUrl: 'example.youtrack.cloud/', apiToken: 'perm:x' })).toEqual({ valid: true });
    expect(req(0).url).toBe(`${BASE}/users/me`);
    expect(req(0).queryParams).toEqual({ fields: 'id,login' });
    expect(sendRequest.mock.calls[0][1].dispatcher.constructor.name).toBe('Agent');
  });

  it('gives a token message on 401 with the vendor text', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: { error: 'Unauthorized', error_description: 'Invalid token' } }));
    const result = JSON.stringify(await validate({ baseUrl: 'https://example.youtrack.cloud', apiToken: 'perm:bad' }));
    expect(result).toContain('rejected the permanent token (HTTP 401)');
    expect(result).toContain('Invalid token');
  });

  it('says the URL looks wrong on 404 and on a non-YouTrack 200', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: '<html>nope</html>' }));
    expect(JSON.stringify(await validate({ baseUrl: 'https://example.com', apiToken: 'perm:x' }))).toContain('does not look like a YouTrack URL');
    ok('<html>welcome</html>');
    expect(JSON.stringify(await validate({ baseUrl: 'https://example.com', apiToken: 'perm:x' }))).toContain('does not look like a YouTrack URL');
  });

  it('never calls a network failure an invalid token', async () => {
    sendRequest.mockRejectedValueOnce(new TypeError('getaddrinfo ENOTFOUND nope.example'));
    const result = JSON.stringify(await validate({ baseUrl: 'https://nope.example', apiToken: 'perm:x' }));
    expect(result).toContain('could not reach https://nope.example');
    expect(result).not.toContain('token');
  });

  it('rejects a malformed URL without a request', async () => {
    expect(await validate({ baseUrl: 'not a url', apiToken: 'perm:x' })).toMatchObject({ valid: false });
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('download origin rule', () => {
  it('resolves instance-relative URLs against the base and its context path', () => {
    expect(youtrackClient.resolveDownloadUrl({ baseUrl: 'https://x.youtrack.cloud', url: '/api/files/1?sign=s' }))
      .toEqual({ url: 'https://x.youtrack.cloud/api/files/1?sign=s', sameOrigin: true });
    expect(youtrackClient.resolveDownloadUrl({ baseUrl: 'https://h.example.com/youtrack', url: '/api/files/1' }).url)
      .toBe('https://h.example.com/youtrack/api/files/1');
    expect(youtrackClient.resolveDownloadUrl({ baseUrl: 'https://h.example.com/youtrack', url: '/youtrack/api/files/1' }).url)
      .toBe('https://h.example.com/youtrack/api/files/1');
  });

  it('marks lookalike hosts, protocol-relative URLs and other paths as foreign', () => {
    expect(youtrackClient.resolveDownloadUrl({ baseUrl: 'https://x.youtrack.cloud', url: 'https://x.youtrack.cloud.evil.io/api/files/1' }).sameOrigin).toBe(false);
    expect(youtrackClient.resolveDownloadUrl({ baseUrl: 'https://x.youtrack.cloud', url: '//evil.io/api/files/1' }).sameOrigin).toBe(false);
    expect(youtrackClient.resolveDownloadUrl({ baseUrl: 'https://h.example.com/youtrack', url: 'https://h.example.com/other/file' }).sameOrigin).toBe(false);
    expect(() => youtrackClient.resolveDownloadUrl({ baseUrl: 'https://x.youtrack.cloud', url: 'file:///etc/passwd' })).toThrow('unsupported scheme');
    expect(() => youtrackClient.resolveDownloadUrl({ baseUrl: 'https://h.example.com/youtrack', url: '/api/../../other/file' })).toThrow('leaves the instance path');
    expect(youtrackClient.resolveDownloadUrl({ baseUrl: 'https://h.example.com/youtrack', url: '/api/files/../files/1' }))
      .toEqual({ url: 'https://h.example.com/youtrack/api/files/1', sameOrigin: true });
  });

  it('download_attachment sends the token only to the instance', async () => {
    ok({ id: '1-1', name: 'a.png', url: '/api/files/1-1?sign=abc', mimeType: 'image/png' });
    sendRequest.mockResolvedValueOnce({ status: 200, headers: { 'content-type': 'image/png' }, body: Readable.from([Buffer.from('PNGDATA')]) });
    const out = await call({ fn: downloadAttachmentAction.run, propsValue: { issue: '2-1', attachmentId: '1-1' } });
    expect(req(1).url).toBe('https://example.youtrack.cloud/api/files/1-1?sign=abc');
    expect(req(1).headers['Authorization']).toBe('Bearer perm:abc');
    expect(req(1).headers['Accept']).toBe('*/*');
    expect(req(1).responseType).toBe('stream');
    expect(req(1).timeout).toBeGreaterThan(299000);
    expect(req(1).timeout).toBeLessThanOrEqual(300000);
    expect(sendRequest.mock.calls[1][1].dispatcher.constructor.name).toBe('Agent');
    expect(out).toMatchObject({ file_name: 'a.png', content_type: 'image/png', base64_content: Buffer.from('PNGDATA').toString('base64'), size_bytes: 7 });

    ok({ id: '1-1', name: 'a.png', url: 'https://example.youtrack.cloud.evil.io/api/files/1-1?sign=abc' });
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: Readable.from([Buffer.from('X')]) });
    await call({ fn: downloadAttachmentAction.run, propsValue: { issue: '2-1', attachmentId: '1-1' } });
    expect(req(3).url).toBe('https://example.youtrack.cloud.evil.io/api/files/1-1?sign=abc');
    expect(req(3).headers['Authorization']).toBeUndefined();
  });
});

describe('download redirects', () => {
  function redirect({ status, location }: { status: number; location?: string }) {
    sendRequest.mockResolvedValueOnce({ status, headers: location === undefined ? {} : { location }, body: Readable.from([]) });
  }
  function file(content: string) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: { 'content-type': 'text/plain' }, body: Readable.from([Buffer.from(content)]) });
  }

  it('follows a same-origin redirect with the token and a cross-origin one without it', async () => {
    redirect({ status: 302, location: '/api/files/1-1/content?sign=s2' });
    redirect({ status: 307, location: 'https://cdn.example.net/blob/1?sig=abc' });
    file('DATA');
    const out = await youtrackClient.download({ auth: AUTH, url: '/api/files/1-1?sign=s1', operation: 'download' });
    expect(out.data.toString()).toBe('DATA');
    expect(req(0).followRedirects).toBe(false);
    expect(req(1).url).toBe('https://example.youtrack.cloud/api/files/1-1/content?sign=s2');
    expect(req(1).headers['Authorization']).toBe('Bearer perm:abc');
    expect(req(2).url).toBe('https://cdn.example.net/blob/1?sig=abc');
    expect(req(2).headers['Authorization']).toBeUndefined();
    for (const [request, options] of sendRequest.mock.calls) {
      expect(request.followRedirects).toBe(false);
      expect(options.dispatcher.constructor.name).toBe('Agent');
      expect(request.timeout).toBeLessThanOrEqual(300000);
    }
  });

  it('stops after 5 redirects and refuses a 3xx without a Location', async () => {
    for (let i = 0; i < 6; i++) redirect({ status: 302, location: `/api/files/${i}` });
    await expect(youtrackClient.download({ auth: AUTH, url: '/api/files/x', operation: 'download' })).rejects.toThrow('more than 5 redirects');
    expect(sendRequest).toHaveBeenCalledTimes(6);
    sendRequest.mockReset();
    redirect({ status: 304 });
    await expect(youtrackClient.download({ auth: AUTH, url: '/api/files/x', operation: 'download' })).rejects.toThrow('redirect');
  });

  it('refuses a redirect to another scheme', async () => {
    redirect({ status: 302, location: 'file:///etc/passwd' });
    await expect(youtrackClient.download({ auth: AUTH, url: '/api/files/x', operation: 'download' })).rejects.toThrow('unsupported scheme');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });
});

describe('list_tags', () => {
  it('keeps "Only me" for visibility and edit rights when YouTrack sends no group', async () => {
    ok([
      { id: '6-1', name: 'private', visibleFor: null, updateableBy: null },
      { id: '6-2', name: 'shared', visibleFor: { id: '3-1', name: 'All Users' }, updateableBy: { id: '3-2', name: 'Developers' } },
    ]);
    const out = await call({ fn: listTagsAction.run, propsValue: {} });
    expect(out).toEqual([
      expect.objectContaining({ id: '6-1', visible_for_name: 'Only me', updateable_by_name: 'Only me' }),
      expect.objectContaining({ id: '6-2', visible_for_name: 'All Users', updateable_by_name: 'Developers' }),
    ]);
  });
});

describe('search text is also applied locally', () => {
  it('search_articles drops rows that do not contain the search text even if YouTrack ignored the query', async () => {
    ok([
      { id: '167-1', idReadable: 'APT-A-1', summary: 'Release notes', content: 'How to SETUP the runner' },
      { id: '167-2', idReadable: 'APT-A-2', summary: 'Onboarding', content: 'Welcome' },
      { id: '167-3', idReadable: 'SETUP-A-3', summary: 'Other', content: null },
    ]);
    const out = await call({ fn: searchArticlesAction.run, propsValue: { query: 'setup', limit: 10 } });
    expect(out).toEqual({ items: [expect.objectContaining({ id: '167-1' }), expect.objectContaining({ id: '167-3' })], hasMore: false, scanLimitReached: false });
    expect(out.items[0]).not.toHaveProperty('content');
    expect(req(0).queryParams).toMatchObject({ query: 'setup' });
    expect(req(0).queryParams.fields).toContain(',content');
  });

  it('search_articles returns an empty list for a word that matches nothing', async () => {
    ok([{ id: '167-1', idReadable: 'APT-A-1', summary: 'Release notes', content: 'Welcome' }]);
    const out = await call({ fn: searchArticlesAction.run, propsValue: { query: 'zzqxnomatch' } });
    expect(out).toEqual({ items: [], hasMore: false, scanLimitReached: false });
  });

  it('search_articles without search text keeps every row and does not fetch content', async () => {
    ok([{ id: '167-1', summary: 'A' }, { id: '167-2', summary: 'B' }]);
    const out = await call({ fn: searchArticlesAction.run, propsValue: {} });
    expect(out.items).toHaveLength(2);
    expect(req(0).queryParams.fields).not.toContain('content');
  });

  it('find_users keeps only users whose login, name or email contains the search text', async () => {
    ok([
      { id: '1-1', login: 'jdoe', fullName: 'Jane Doe', email: 'jane@acme.io' },
      { id: '1-2', login: 'bob', fullName: 'Bob Smith', email: 'bob@acme.io' },
      { id: '1-3', login: 'admin', fullName: 'Admin', email: 'JANE.ops@acme.io' },
    ]);
    const out = await call({ fn: findUsersAction.run, propsValue: { query: 'Jane' } });
    expect(out.items.map((u) => u.id)).toEqual(['1-1', '1-3']);
    expect(req(0).queryParams).toMatchObject({ query: 'Jane' });
  });
});

describe('search text pages through YouTrack before skip and limit', () => {
  const users = ({ count, offset, match = [] }: { count: number; offset: number; match?: number[] }) =>
    Array.from({ length: count }, (_, i) => {
      const n = offset + i;
      return match.includes(n) ? { id: `1-${n}`, login: `jane${n}` } : { id: `1-${n}`, login: `user${n}` };
    });

  it('find_users returns a match that only appears on the third provider page', async () => {
    ok(users({ count: 100, offset: 0 }));
    ok(users({ count: 100, offset: 100 }));
    ok(users({ count: 30, offset: 200, match: [215] }));
    const out = await call({ fn: findUsersAction.run, propsValue: { query: 'jane', limit: 5 } });
    expect(out).toEqual({ items: [expect.objectContaining({ id: '1-215', login: 'jane215' })], hasMore: false, scanLimitReached: false });
    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect([0, 1, 2].map((i) => req(i).queryParams.$skip)).toEqual(['0', '100', '200']);
    expect(req(2).queryParams).toMatchObject({ query: 'jane', $top: '100' });
  });

  it('applies skip, limit and hasMore to matching rows, not provider rows', async () => {
    ok(users({ count: 100, offset: 0, match: [3, 50, 99] }));
    ok(users({ count: 100, offset: 100, match: [120, 180] }));
    const out = await call({ fn: findUsersAction.run, propsValue: { query: 'jane', limit: 2, skip: 1 } });
    expect(out.items.map((u) => u.id)).toEqual(['1-50', '1-99']);
    expect(out.hasMore).toBe(true);
    expect(out.scanLimitReached).toBe(false);
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('reports hasMore false when the last match is the last one returned', async () => {
    ok(users({ count: 100, offset: 0, match: [3, 50] }));
    ok(users({ count: 10, offset: 100, match: [105] }));
    const out = await call({ fn: findUsersAction.run, propsValue: { query: 'jane', limit: 2, skip: 1 } });
    expect(out).toMatchObject({ hasMore: false, scanLimitReached: false });
    expect(out.items.map((u) => u.id)).toEqual(['1-50', '1-105']);
  });

  it('returns an empty list when no page matches', async () => {
    ok(users({ count: 100, offset: 0 }));
    ok(users({ count: 40, offset: 100 }));
    const out = await call({ fn: findUsersAction.run, propsValue: { query: 'jane' } });
    expect(out).toEqual({ items: [], hasMore: false, scanLimitReached: false });
  });

  it('stops after the row cap and says so in scanLimitReached', async () => {
    const pages = youtrackClient.SEARCH_MAX_ROWS / 100;
    for (let i = 0; i < pages; i++) {
      ok(users({ count: 100, offset: i * 100, match: i === 0 ? [7] : [] }));
    }
    const out = await call({ fn: findUsersAction.run, propsValue: { query: 'jane' } });
    expect(out).toEqual({ items: [expect.objectContaining({ id: '1-7' })], hasMore: false, scanLimitReached: true });
    expect(sendRequest).toHaveBeenCalledTimes(pages);
  });

  it('stops when the time budget is used up and says so', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(0).mockReturnValueOnce(1_000).mockReturnValue(10_000_000);
    ok(users({ count: 100, offset: 0 }));
    try {
      const out = await call({ fn: findUsersAction.run, propsValue: { query: 'jane' } });
      expect(out).toEqual({ items: [], hasMore: false, scanLimitReached: true });
      expect(sendRequest).toHaveBeenCalledTimes(1);
    } finally {
      now.mockRestore();
    }
  });

  it('search_articles finds a match on page 3 and pages over matches', async () => {
    const articles = ({ count, offset, match = [] }: { count: number; offset: number; match?: number[] }) =>
      Array.from({ length: count }, (_, i) => ({ id: `167-${offset + i}`, summary: match.includes(offset + i) ? 'Runner setup' : 'Other', content: 'x' }));
    ok(articles({ count: 100, offset: 0 }));
    ok(articles({ count: 100, offset: 100 }));
    ok(articles({ count: 100, offset: 200, match: [201, 250, 260] }));
    const out = await call({ fn: searchArticlesAction.run, propsValue: { query: 'setup', limit: 1, skip: 1 } });
    expect(out).toEqual({ items: [expect.objectContaining({ id: '167-250' })], hasMore: true, scanLimitReached: false });
    expect(sendRequest).toHaveBeenCalledTimes(3);
  });

  it('without search text keeps the single-page provider skip and limit', async () => {
    ok(users({ count: 3, offset: 4 }));
    const out = await call({ fn: findUsersAction.run, propsValue: { limit: 2, skip: 4 } });
    expect(req(0).queryParams).toMatchObject({ $top: '3', $skip: '4' });
    expect(req(0).queryParams).not.toHaveProperty('query');
    expect(out).toMatchObject({ hasMore: true, scanLimitReached: false });
    expect(out.items).toHaveLength(2);
  });
});

describe('existing list limits stay lenient (ISSUE-187)', () => {
  const page = ({ count, offset = 0 }: { count: number; offset?: number }) => Array.from({ length: count }, (_, i) => ({ id: `6-${offset + i}`, name: `t${offset + i}` }));

  it.each([0, -1])('list_tags limit %s reads every page instead of throwing', async (limit) => {
    ok(page({ count: 100 }));
    ok(page({ count: 5, offset: 100 }));
    const out = await call({ fn: listTagsAction.run, propsValue: { limit } });
    expect(Array.isArray(out) ? out.length : 0).toBe(105);
    expect(req(0).queryParams).toMatchObject({ $top: '100', $skip: '0' });
    expect(req(1).queryParams).toMatchObject({ $top: '100', $skip: '100' });
  });

  it('list_tags limit 2.5 is floored to 2', async () => {
    ok(page({ count: 3 }));
    const out = await call({ fn: listTagsAction.run, propsValue: { limit: 2.5 } });
    expect(Array.isArray(out) ? out.length : 0).toBe(2);
    expect(req(0).queryParams).toMatchObject({ $top: '3' });
  });

  it('list_tags limit 0.4 becomes 1, and an empty limit uses the old default', async () => {
    ok(page({ count: 2 }));
    expect(await call({ fn: listTagsAction.run, propsValue: { limit: 0.4 } })).toHaveLength(1);
    ok(page({ count: 3 }));
    await call({ fn: listTagsAction.run, propsValue: {} });
    expect(req(1).queryParams).toMatchObject({ $top: '100' });
  });

  it('search_issues limit -1 with skip reads to the end from the offset', async () => {
    ok([{ id: '2-1', customFields: [] }]);
    const out = await call({ fn: searchIssuesAction.run, propsValue: { limit: -1, skip: 10 } });
    expect(Array.isArray(out) ? out.length : 0).toBe(1);
    expect(req(0).queryParams).toMatchObject({ $top: '100', $skip: '10' });
  });

  it('the "all" path still throws at its 10,000 cap', async () => {
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: page({ count: 100 }) });
    await expect(call({ fn: listTagsAction.run, propsValue: { limit: 0 } })).rejects.toThrow('more than 10000');
  });
});

describe('existing actions', () => {
  it('search_issues pages past 100 with $skip and resolves a project ID to its short name', async () => {
    ok({ id: '0-5', shortName: 'APT', name: 'AP Test' });
    ok(Array.from({ length: 100 }, (_, i) => ({ id: `2-${i}`, customFields: [] })));
    ok(Array.from({ length: 60 }, (_, i) => ({ id: `2-${100 + i}`, customFields: [] })));
    const out = await call({ fn: searchIssuesAction.run, propsValue: { project: '0-5', query: '#Unresolved', limit: 150 } });
    expect(req(0).url).toBe(`${BASE}/admin/projects/0-5`);
    expect(req(1).queryParams).toMatchObject({ query: 'project: {APT} #Unresolved', $top: '100', $skip: '0' });
    expect(req(2).queryParams).toMatchObject({ $top: '51', $skip: '100' });
    expect(Array.isArray(out) ? out.length : 0).toBe(150);
  });

  it('search_issues keeps a short name as is', async () => {
    ok([]);
    await call({ fn: searchIssuesAction.run, propsValue: { project: 'APT' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(req(0).queryParams).toMatchObject({ query: 'project: {APT}', $top: '100' });
  });

  it('create_issue keeps main\'s $type array untouched and does not fetch the schema', async () => {
    const legacy = [{ name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { name: 'Critical' } }];
    ok({ id: '2-9', idReadable: 'APT-9', tags: [{ name: 'a' }, { name: 'b' }], customFields: [{ name: 'Priority', value: { name: 'Critical' } }] });
    const out = await call({ fn: createIssueAction.run, propsValue: { project: '0-5', summary: 'S', customFieldsJson: legacy } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(req(0).method).toBe('POST');
    expect(req(0).body).toEqual({ project: { id: '0-5' }, summary: 'S', customFields: legacy });
    expect(out).toMatchObject({ idReadable: 'APT-9', tags: 'a, b', customFields: { Priority: 'Critical' } });
  });

  it('create_issue resolves a short name and maps a field map through the project schema', async () => {
    ok([{ id: '0-5', shortName: 'APT', name: 'AP Test' }]);
    ok([{ field: { name: 'Priority', fieldType: { id: 'enum[1]', isMultiValue: false } } }]);
    ok({ id: '2-9' });
    await call({ fn: createIssueAction.run, propsValue: { project: 'apt', summary: 'S', customFieldsJson: { Priority: 'Major' } } });
    expect(req(1).url).toBe(`${BASE}/admin/projects/0-5/customFields`);
    expect(req(2).body).toEqual({
      project: { id: '0-5' },
      summary: 'S',
      customFields: [{ name: 'Priority', $type: 'SingleEnumIssueCustomField', value: { name: 'Major' } }],
    });
  });

  it('update_issue clears the description with "yes" and reads field types from the issue itself', async () => {
    ok({ customFields: [{ name: 'Assignee', $type: 'SingleUserIssueCustomField', projectCustomField: { field: { name: 'Assignee', fieldType: { id: 'user[1]' } } } }] });
    ok({ id: '2-9' });
    await call({ fn: updateIssueAction.run, propsValue: { issue: '2-9', clearDescription: 'yes', customFieldsJson: { Assignee: 'jane' } } });
    expect(req(0).url).toBe(`${BASE}/issues/2-9`);
    expect(req(0).queryParams.fields).toContain('customFields($type,name,projectCustomField(');
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(req(1).body).toEqual({ description: '', customFields: [{ name: 'Assignee', $type: 'SingleUserIssueCustomField', value: { login: 'jane' } }] });
  });

  it('update_issue refuses Description together with Clear Description', async () => {
    await expect(call({ fn: updateIssueAction.run, propsValue: { issue: '2-9', description: 'x', clearDescription: 'yes' } })).rejects.toThrow('not both');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('update_issue with nothing set keeps main\'s no-op POST', async () => {
    ok({ id: '2-9' });
    await call({ fn: updateIssueAction.run, propsValue: { issue: '2-9', clearDescription: 'no' } });
    expect(req(0).body).toEqual({});
  });

  it('get_issue_history follows afterCursor and names the changed field and comment text', async () => {
    ok({
      activities: [{ $type: 'CustomFieldActivityItem', timestamp: 1, author: { name: 'A', login: 'a' }, field: { name: 'State' }, target: { id: '2-1' }, added: [{ name: 'Fixed' }], removed: [{ name: 'Open' }] }],
      hasAfter: true,
      afterCursor: 'c1',
    });
    ok({
      activities: [{ $type: 'CommentActivityItem', timestamp: 2, author: { login: 'b' }, targetMember: 'comments', target: { id: '2-1' }, added: [{ $type: 'IssueComment', id: '4-1', text: 'hello' }] }],
      hasAfter: false,
    });
    const out = await call({ fn: getIssueHistoryAction.run, propsValue: { issue: '2-1', categories: ['CustomFieldCategory', 'CommentsCategory'] } });
    expect(req(0).url).toBe(`${BASE}/issues/2-1/activitiesPage`);
    expect(req(0).queryParams).toMatchObject({ categories: 'CustomFieldCategory,CommentsCategory', $top: '100' });
    expect(req(0).queryParams.cursor).toBeUndefined();
    expect(req(1).queryParams).toMatchObject({ cursor: 'c1' });
    expect(out).toEqual([
      expect.objectContaining({ field_name: 'State', added_values: 'Fixed', removed_values: 'Open', comment_text: null, target_id: '2-1', author_login: 'a' }),
      expect.objectContaining({ field_name: 'comments', comment_text: 'hello', added_values: 'hello' }),
    ]);
  });

  it('link_issues and apply_command send the database id of a readable source issue to /commands (live BUG-1)', async () => {
    ok({ id: '3-145', idReadable: 'APT-125' });
    ok({ id: '2-3', idReadable: 'APT-3' });
    ok(undefined);
    ok([{ linkType: { name: 'Relates', sourceToTarget: 'relates to', targetToSource: 'relates to' }, issues: [{ id: '2-3' }] }]);
    await call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: 'APT-125', targetIssueId: 'APT-3', linkType: 'relates to' } });
    expect(req(0).url).toBe(`${BASE}/issues/APT-125`);
    expect(req(2).body).toEqual({ query: 'relates to APT-3', issues: [{ id: '3-145' }] });
    expect(req(3).url).toBe(`${BASE}/issues/3-145/links`);

    sendRequest.mockReset();
    ok({ id: '3-145', idReadable: 'APT-125' });
    ok(undefined);
    await call({ fn: applyCommandAction.run, propsValue: { issue: 'APT-125', command: 'State Fixed' } });
    expect(req(1).body).toEqual({ query: 'State Fixed', issues: [{ id: '3-145' }] });

    sendRequest.mockReset();
    ok(undefined);
    await call({ fn: applyCommandAction.run, propsValue: { issue: '3-145', command: 'State Fixed' } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(req(0).body).toEqual({ query: 'State Fixed', issues: [{ id: '3-145' }] });
  });

  it('upload_attachment sends an ASCII filename plus filename* for quotes, backslashes and unicode (live BUG-4)', async () => {
    ok([{ id: '12-3', name: 'ap test "quoted".txt' }]);
    ok([{ id: '12-4', name: 'x' }]);
    ok([{ id: '12-5', name: 'x' }]);
    const files = [
      { fileName: 'ap test "quoted".txt', fileContent: { data: Buffer.from('a') } },
      { fileName: 'a\\b.txt', fileContent: { data: Buffer.from('b') } },
      { fileName: 'résumé ü.pdf', fileContent: { data: Buffer.from('c') } },
    ];
    await call({ fn: uploadAttachmentAction.run, propsValue: { issue: '2-1', files } });
    const header = (i: number) => {
      const body: Buffer = req(i).body;
      return body.toString('utf8').split('\r\n')[1];
    };
    expect(header(0)).toBe(`Content-Disposition: form-data; name="upload"; filename="ap test _quoted_.txt"; filename*=UTF-8''ap%20test%20%22quoted%22.txt`);
    expect(header(1)).toBe(`Content-Disposition: form-data; name="upload"; filename="a_b.txt"; filename*=UTF-8''a_b.txt`);
    expect(header(2)).toBe(`Content-Disposition: form-data; name="upload"; filename="r_sum_ _.pdf"; filename*=UTF-8''r%C3%A9sum%C3%A9%20%C3%BC.pdf`);
  });

  it('link_issues resolves the target first and fails when the link is not on the issue afterwards', async () => {
    ok({ id: '2-3', idReadable: 'APT-3', summary: 'T' });
    ok(undefined);
    ok([{ linkType: { name: 'Relates', sourceToTarget: 'relates to', targetToSource: 'relates to' }, issues: [{ id: '2-2', idReadable: 'APT-2' }] }]);
    await expect(call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'APT-3', linkType: 'relates to' } })).rejects.toThrow('link to APT-3 is not on the issue');
    expect(req(0).url).toBe(`${BASE}/issues/APT-3`);
    expect(req(1).body).toEqual({ query: 'relates to APT-3', issues: [{ id: '2-1' }] });
    expect(req(2).url).toBe(`${BASE}/issues/2-1/links`);
  });

  it('link_issues refuses an unknown target before sending the command', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: { error: 'Not Found', error_description: 'Entity with id APT-99 not found' } }));
    await expect(call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'APT-99', linkType: 'relates to' } })).rejects.toThrow('APT-99 not found');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('link_issues accepts an old readable ID after a project rename by matching the database id', async () => {
    ok({ id: '2-3', idReadable: 'NEW-3', summary: 'T' });
    ok(undefined);
    ok([{ direction: 'INWARD', linkType: { name: 'Depend', sourceToTarget: 'is required for', targetToSource: 'depends on' }, issues: [{ id: '2-3', idReadable: 'NEW-3' }] }]);
    expect(await call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'OLD-3', linkType: 'depends on' } }))
      .toEqual({ success: true, link_type: 'depends on', target_issue: 'OLD-3' });
    expect(req(1).body).toEqual({ query: 'depends on OLD-3', issues: [{ id: '2-1' }] });
  });

  it('link_issues does not accept a reverse link of the same type as the requested direction', async () => {
    ok({ id: '2-3', idReadable: 'APT-3' });
    ok(undefined);
    ok([
      { direction: 'OUTWARD', linkType: { name: 'Depend', sourceToTarget: 'is required for', targetToSource: 'depends on' }, issues: [{ id: '2-3' }] },
      { direction: 'INWARD', linkType: { name: 'Depend', sourceToTarget: 'is required for', targetToSource: 'depends on' }, issues: [] },
    ]);
    await expect(call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'APT-3', linkType: 'depends on' } }))
      .rejects.toThrow('link to APT-3 is not on the issue');

    ok({ id: '2-3', idReadable: 'APT-3' });
    ok(undefined);
    ok([{ direction: 'OUTWARD', linkType: { name: 'Subtask', sourceToTarget: 'parent for', targetToSource: 'subtask of' }, issues: [{ id: '2-3' }] }]);
    expect(await call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'APT-3', linkType: 'parent for' } }))
      .toMatchObject({ success: true });

    ok({ id: '2-3', idReadable: 'APT-3' });
    ok(undefined);
    ok([{ direction: 'BOTH', linkType: { name: 'Relates', sourceToTarget: 'relates to', targetToSource: 'relates to' }, issues: [{ id: '2-3' }] }]);
    expect(await call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'APT-3', linkType: 'relates to' } }))
      .toMatchObject({ success: true });
  });

  it('link_issues verifies every one of several targets', async () => {
    ok({ id: '2-4', idReadable: 'APT-4' });
    ok({ id: '2-5', idReadable: 'APT-5' });
    ok(undefined);
    ok([{ linkType: { name: 'Relates', sourceToTarget: 'relates to', targetToSource: 'relates to' }, issues: [{ id: '2-4' }, { id: '2-5' }] }]);
    expect(await call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'APT-4 APT-5', linkType: 'relates to' } }))
      .toMatchObject({ success: true });
    expect(req(2).body).toEqual({ query: 'relates to APT-4 relates to APT-5', issues: [{ id: '2-1' }] });

    ok({ id: '2-4', idReadable: 'APT-4' });
    ok({ id: '2-5', idReadable: 'APT-5' });
    ok(undefined);
    ok([{ linkType: { name: 'Relates', sourceToTarget: 'relates to', targetToSource: 'relates to' }, issues: [{ id: '2-4' }] }]);
    await expect(call({ fn: linkIssuesAction.run, propsValue: { sourceIssue: '2-1', targetIssueId: 'APT-4 APT-5', linkType: 'relates to' } }))
      .rejects.toThrow('link to APT-5 is not on the issue');
  });

  it('get_issue_history leaves comment_text empty for a text custom-field change', async () => {
    ok({ activities: [{ $type: 'CustomFieldActivityItem', timestamp: 1, field: { name: 'Notes' }, target: { id: '2-1' }, added: [{ $type: 'TextFieldValue', text: 'new notes' }] }], hasAfter: false });
    const out = await call({ fn: getIssueHistoryAction.run, propsValue: { issue: '2-1', categories: ['CustomFieldCategory'] } });
    expect(out).toEqual([expect.objectContaining({ field_name: 'Notes', added_values: 'new notes', comment_text: null })]);
  });

  it('list_tags maps owner and paging, with "Only me" when the tag has no group', async () => {
    ok([{ id: '6-1', name: 't', owner: { id: '1-1', name: 'A' }, untagOnResolve: false }]);
    const out = await call({ fn: listTagsAction.run, propsValue: { limit: 10 } });
    expect(out).toEqual([{ id: '6-1', name: 't', owner_name: 'A', owner_id: '1-1', visible_for_name: 'Only me', updateable_by_name: 'Only me', untag_on_resolve: false }]);
    expect(req(0).queryParams).toMatchObject({ $top: '11', $skip: '0' });
  });

  it('delete_attachment and remove_tag_from_issue return the ids and encode them', async () => {
    ok(undefined);
    expect(await call({ fn: deleteAttachmentAction.run, propsValue: { issue: '2-1', attachmentId: '134/31' } }))
      .toEqual({ success: true, issue_id: '2-1', attachment_id: '134/31' });
    expect(req(0).url).toBe(`${BASE}/issues/2-1/attachments/134%2F31`);
    ok(undefined);
    expect(await call({ fn: removeTagFromIssueAction.run, propsValue: { issue: '2-1', tag: '6-1' } }))
      .toEqual({ success: true, issue_id: '2-1', tag_id: '6-1' });
    expect(req(1).method).toBe('DELETE');
  });

  it('upload_attachment duck-types the file, redacts errors and names files already attached', async () => {
    ok([{ id: '1-1', name: 'a.txt', $type: 'IssueAttachment' }]);
    sendRequest.mockRejectedValueOnce(httpError({ status: 413, body: { error_description: 'Too large' }, requestBody: '[redacted]' }));
    const files = [
      { fileName: 'a.txt', fileContent: { filename: 'a.txt', data: Buffer.from('FILE-A-SECRET') } },
      { fileName: 'b.txt', fileContent: { filename: 'b.txt', data: Buffer.from('FILE-B-SECRET') } },
    ];
    const error = await call({ fn: uploadAttachmentAction.run, propsValue: { issue: '2-1', files } }).catch((e: unknown) => e);
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('Too large');
    expect(message).toContain('Already attached before this failure: a.txt');
    expect(message).not.toContain('FILE-B-SECRET');
    expect(req(0).headers['Content-Type']).toMatch(/^multipart\/form-data; boundary=/);
    expect(Buffer.isBuffer(req(0).body) && req(0).body.includes(Buffer.from('FILE-A-SECRET'))).toBe(true);
    expect(req(1).redactBodyInErrors).toBe(true);
    expect(error).toBeInstanceOf(YoutrackApiError);
    expect(error).toMatchObject({ status: 413, responseBody: { error_description: 'Too large' } });
  });
});

describe('list_projects paging', () => {
  it('without a filter reads only the requested page from the server', async () => {
    ok([{ id: '0-5', name: 'AP', shortName: 'AP' }, { id: '0-6', name: 'B', shortName: 'B' }, { id: '0-7', name: 'C', shortName: 'C' }]);
    const out = await call({ fn: listProjectsAction.run, propsValue: { limit: 2, skip: 40 } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(req(0).queryParams).toMatchObject({ $top: '3', $skip: '40' });
    expect(out).toEqual({ items: [expect.objectContaining({ id: '0-5' }), expect.objectContaining({ id: '0-6' })], hasMore: true });
  });
});

describe('new actions send the documented request', () => {
  const cases: Array<{
    name: string;
    run: (ctx: never) => Promise<unknown>;
    propsValue: Record<string, unknown>;
    responses: unknown[];
    method: string;
    path: string;
    query?: Record<string, string>;
    body?: unknown;
    output?: unknown;
  }> = [
    {
      name: 'list_projects',
      run: listProjectsAction.run,
      propsValue: { query: 'ap', limit: 1 },
      responses: [[{ id: '0-5', name: 'AP Test', shortName: 'APT', leader: { login: 'admin', name: 'Admin' } }, { id: '0-6', name: 'Other', shortName: 'APT2' }, { id: '0-7', name: 'Zed', shortName: 'Z' }]],
      method: 'GET',
      path: '/admin/projects',
      query: { $top: '100', $skip: '0' },
      output: { items: [expect.objectContaining({ id: '0-5', shortName: 'APT', leader_login: 'admin' })], hasMore: true },
    },
    {
      name: 'get_project',
      run: getProjectAction.run,
      propsValue: { project: '0-5' },
      responses: [{ id: '0-5', name: 'AP', team: { id: '9-1', name: 'AP Team' } }, { enabled: true, workItemTypes: [{ id: '5-0', name: 'Development' }], estimate: { field: { name: 'Estimation' } } }],
      method: 'GET',
      path: '/admin/projects/0-5',
      output: expect.objectContaining({ team_name: 'AP Team', time_tracking_enabled: true, estimate_field: 'Estimation', work_item_types: [{ id: '5-0', name: 'Development' }] }),
    },
    {
      name: 'list_project_custom_fields',
      run: listProjectCustomFieldsAction.run,
      propsValue: { project: '0-5' },
      responses: [[{ canBeEmpty: false, field: { name: 'Priority', fieldType: { id: 'enum[1]', isMultiValue: false } }, bundle: { values: [{ name: 'Major' }, { name: 'Old', archived: true }] } }]],
      method: 'GET',
      path: '/admin/projects/0-5/customFields',
      output: { project_id: '0-5', fields_source: 'project settings', fields: [expect.objectContaining({ name: 'Priority', issueFieldType: 'SingleEnumIssueCustomField', required: true, allowedValues: ['Major'] })] },
    },
    {
      name: 'find_users',
      run: findUsersAction.run,
      propsValue: { query: 'jane', limit: 2, skip: 4 },
      responses: [[{ id: '1-2', login: 'jane' }]],
      method: 'GET',
      path: '/users',
      query: { query: 'jane', $top: '100', $skip: '0', fields: 'id,login,fullName,email,banned,guest,online' },
      output: { items: [], hasMore: false, scanLimitReached: false },
    },
    {
      name: 'get_current_user',
      run: getCurrentUserAction.run,
      propsValue: {},
      responses: [{ id: '1-1', login: 'admin', profiles: { general: { timezone: { id: 'Europe/Berlin' } } } }],
      method: 'GET',
      path: '/users/me',
      output: expect.objectContaining({ login: 'admin', timezone: 'Europe/Berlin' }),
    },
    {
      name: 'list_groups',
      run: listGroupsAction.run,
      propsValue: {},
      responses: [[{ id: '3-1', name: 'AP Testers', usersCount: 2 }]],
      method: 'GET',
      path: '/groups',
      query: { $top: '51', $skip: '0' },
      output: { items: [{ id: '3-1', name: 'AP Testers', usersCount: 2 }], hasMore: false },
    },
    {
      name: 'list_agile_boards',
      run: listAgileBoardsAction.run,
      propsValue: {},
      responses: [[{ id: '120-1', name: 'APT', sprintsSettings: { disableSprints: false, isExplicit: true }, currentSprint: { id: '121-1', name: 'S1' } }]],
      method: 'GET',
      path: '/agiles',
      output: { items: [expect.objectContaining({ id: '120-1', sprints_enabled: true, manual_sprint_assignment: true, current_sprint_id: '121-1' })], hasMore: false },
    },
    {
      name: 'list_sprints',
      run: listSprintsAction.run,
      propsValue: { board: '120-1' },
      responses: [[{ id: '121-1', name: 'S1', start: 1, finish: 2 }]],
      method: 'GET',
      path: '/agiles/120-1/sprints',
      output: { items: [expect.objectContaining({ id: '121-1', name: 'S1' })], hasMore: false },
    },
    {
      name: 'create_sprint',
      run: createSprintAction.run,
      propsValue: { board: '120-1', name: 'S2', start: '2026-12-01', finish: '2026-12-14T17:00:00Z', isDefault: 'no' },
      responses: [{ id: '121-2', name: 'S2' }],
      method: 'POST',
      path: '/agiles/120-1/sprints',
      body: { name: 'S2', start: Date.UTC(2026, 11, 1), finish: Date.UTC(2026, 11, 14, 17), isDefault: false },
    },
    {
      name: 'add_issue_to_sprint',
      run: addIssueToSprintAction.run,
      propsValue: { board: '120-1', sprint: '121-1', issue: 'APT-5' },
      responses: [{ id: '2-5', idReadable: 'APT-5', summary: 'S' }, { id: '2-5' }],
      method: 'GET',
      path: '/issues/APT-5',
      output: { board_id: '120-1', sprint_id: '121-1', issue_id: '2-5', issue_idReadable: 'APT-5', issue_summary: 'S' },
    },
    {
      name: 'list_link_types',
      run: listLinkTypesAction.run,
      propsValue: {},
      responses: [[{ id: '7-1', name: 'Depend', sourceToTarget: 'is required for', targetToSource: 'depends on', directed: true }]],
      method: 'GET',
      path: '/issueLinkTypes',
      output: { items: [expect.objectContaining({ targetToSource: 'depends on' })] },
    },
    {
      name: 'get_issue_links',
      run: getIssueLinksAction.run,
      propsValue: { issue: '2-1' },
      responses: [[{ direction: 'INWARD', linkType: { name: 'Depend', sourceToTarget: 'is required for', targetToSource: 'depends on' }, issues: [{ id: '2-2', idReadable: 'APT-2', summary: 'x' }] }]],
      method: 'GET',
      path: '/issues/2-1/links',
      output: { items: [expect.objectContaining({ relation: 'depends on', issue_idReadable: 'APT-2', direction: 'INWARD' })] },
    },
    {
      name: 'find_work_items',
      run: findWorkItemsAction.run,
      propsValue: { query: 'project: APT', author: 'me', startDate: '2026-11-01', endDate: '2026-11-30' },
      responses: [[{ id: '8-1', date: 1, duration: { minutes: 90, presentation: '1h 30m' }, issue: { idReadable: 'APT-1' } }]],
      method: 'GET',
      path: '/workItems',
      query: { query: 'project: APT', author: 'me', startDate: '2026-11-01', endDate: '2026-11-30', $top: '51', $skip: '0' },
      output: { items: [expect.objectContaining({ id: '8-1', duration_minutes: 90, duration_presentation: '1h 30m', issue_idReadable: 'APT-1' })], hasMore: false },
    },
    {
      name: 'add_work_item',
      run: addWorkItemAction.run,
      propsValue: { issue: '2-1', duration: '1h 30m', date: '2026-11-05', text: 'Fixed', type: '5-0', author: 'jane' },
      responses: [{ id: '8-2', duration: { minutes: 90 } }],
      method: 'POST',
      path: '/issues/2-1/timeTracking/workItems',
      body: { duration: { presentation: '1h 30m' }, date: Date.UTC(2026, 10, 5), text: 'Fixed', type: { id: '5-0' }, author: { login: 'jane' } },
    },
    {
      name: 'delete_work_item',
      run: deleteWorkItemAction.run,
      propsValue: { issue: '2-1', workItem: '8-2' },
      responses: [undefined],
      method: 'DELETE',
      path: '/issues/2-1/timeTracking/workItems/8-2',
      output: { success: true, issue_id: '2-1', work_item_id: '8-2' },
    },
    {
      name: 'search_articles',
      run: searchArticlesAction.run,
      propsValue: { query: 'setup' },
      responses: [[{ id: '167-1', idReadable: 'APT-A-1', summary: 'Setup', project: { shortName: 'APT' } }]],
      method: 'GET',
      path: '/articles',
      query: { query: 'setup' },
      output: { items: [expect.objectContaining({ idReadable: 'APT-A-1', project_shortName: 'APT' })], hasMore: false, scanLimitReached: false },
    },
    {
      name: 'get_article',
      run: getArticleAction.run,
      propsValue: { article: 'APT-A-1' },
      responses: [{ id: '167-1', content: '# Hi', childArticles: [{ idReadable: 'APT-A-2', summary: 'Child' }], tags: [{ name: 'kb' }] }],
      method: 'GET',
      path: '/articles/APT-A-1',
      output: expect.objectContaining({ content: '# Hi', child_articles: [{ id: null, idReadable: 'APT-A-2', summary: 'Child' }], tags: ['kb'] }),
    },
    {
      name: 'create_article',
      run: createArticleAction.run,
      propsValue: { project: '0-5', summary: 'Setup', content: 'Body' },
      responses: [{ id: '167-3' }],
      method: 'POST',
      path: '/articles',
      body: { project: { id: '0-5' }, summary: 'Setup', content: 'Body' },
    },
    {
      name: 'update_article',
      run: updateArticleAction.run,
      propsValue: { article: '167-3', content: 'New' },
      responses: [{ id: '167-3' }],
      method: 'POST',
      path: '/articles/167-3',
      body: { content: 'New' },
    },
    {
      name: 'list_saved_searches',
      run: listSavedSearchesAction.run,
      propsValue: {},
      responses: [[{ id: '9-1', name: 'AP open', query: 'project: APT #Unresolved', owner: { login: 'admin' } }]],
      method: 'GET',
      path: '/savedQueries',
      output: { items: [{ id: '9-1', name: 'AP open', query: 'project: APT #Unresolved', owner_login: 'admin' }], hasMore: false },
    },
    {
      name: 'delete_issue',
      run: deleteIssueAction.run,
      propsValue: { issue: 'APT-9' },
      responses: [undefined],
      method: 'DELETE',
      path: '/issues/APT-9',
      output: { success: true, issue_id: 'APT-9' },
    },
    {
      name: 'update_comment',
      run: updateCommentAction.run,
      propsValue: { issue: '2-1', comment: '4-1', text: 'edited' },
      responses: [{ id: '4-1', text: 'edited', author: { login: 'a', name: 'A' } }],
      method: 'POST',
      path: '/issues/2-1/comments/4-1',
      body: { text: 'edited' },
      output: expect.objectContaining({ id: '4-1', text: 'edited', author_login: 'a' }),
    },
    {
      name: 'delete_comment',
      run: deleteCommentAction.run,
      propsValue: { issue: '2-1', comment: '4-1' },
      responses: [undefined],
      method: 'DELETE',
      path: '/issues/2-1/comments/4-1',
      output: { success: true, issue_id: '2-1', comment_id: '4-1' },
    },
  ];

  it.each(cases)('$name', async ({ run, propsValue, responses, method, path, query, body, output }) => {
    for (const response of responses) ok(response);
    const out = await call({ fn: run, propsValue });
    expect(req(0).method).toBe(method);
    expect(req(0).url).toBe(`${BASE}${path}`);
    if (query !== undefined) expect(req(0).queryParams).toMatchObject(query);
    if (body !== undefined) expect(req(0).body).toEqual(body);
    if (output !== undefined) expect(out).toEqual(output);
    for (const [, options] of sendRequest.mock.calls) {
      expect(options.dispatcher.constructor.name).toBe('Agent');
    }
    for (const [request] of sendRequest.mock.calls) {
      expect(request.redactBodyInErrors).toBe(true);
      expect(request.followRedirects).toBe(false);
    }
  });

  it('add_issue_to_sprint posts the internal issue id', async () => {
    ok({ id: '2-5', idReadable: 'APT-5', summary: 'S' });
    ok({ id: '2-5' });
    await call({ fn: addIssueToSprintAction.run, propsValue: { board: '120-1', sprint: '121-1', issue: 'APT-5' } });
    expect(req(1).url).toBe(`${BASE}/agiles/120-1/sprints/121-1/issues`);
    expect(req(1).body).toEqual({ id: '2-5', $type: 'Issue' });
  });

  it('add_work_item sends a bare number as minutes and refuses a bad date', async () => {
    ok({ id: '8-3' });
    await call({ fn: addWorkItemAction.run, propsValue: { issue: '2-1', duration: '90', date: '2026-11-05' } });
    expect(req(0).body).toEqual({ duration: { minutes: 90 }, date: Date.UTC(2026, 10, 5) });
    await expect(call({ fn: addWorkItemAction.run, propsValue: { issue: '2-1', duration: '1h', date: '05/11/2026' } })).rejects.toThrow('YYYY-MM-DD');
    await expect(call({ fn: addWorkItemAction.run, propsValue: { issue: '2-1', duration: '1h', date: '2026-02-30' } })).rejects.toThrow('not a real calendar date');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('create_sprint refuses a date-time without a time zone', async () => {
    await expect(call({ fn: createSprintAction.run, propsValue: { board: '120-1', name: 'S', start: '2026-12-01T09:00' } })).rejects.toThrow('time zone');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('update_article refuses an empty patch', async () => {
    await expect(call({ fn: updateArticleAction.run, propsValue: { article: '167-3' } })).rejects.toThrow('Nothing to update');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('list limits above 200 are refused rather than silently cut', async () => {
    await expect(call({ fn: findUsersAction.run, propsValue: { limit: 500 } })).rejects.toThrow('200 or less');
  });
});

describe('piece wiring', () => {
  it('idempotent flags match the live repeat calls', () => {
    expect(deleteAttachmentAction.aiMetadata?.idempotent).toBe(false);
    expect(removeTagFromIssueAction.aiMetadata?.idempotent).toBe(false);
  });

  it('registers 41 actions plus Custom API Call, every hand-written one for both audiences with aiMetadata', () => {
    const actions = Object.values(youtrack.actions());
    expect(actions).toHaveLength(42);
    for (const action of actions.filter((a) => a.name !== 'custom_api_call')) {
      expect(action.audience).toBe('both');
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(action.outputSchema).toBeDefined();
    }
  });

  it('aiMetadata and prop descriptions only name actions that exist', () => {
    const actions = Object.values(youtrack.actions());
    const names = actions.map((a) => a.displayName);
    const texts = actions.flatMap((a) => [
      a.aiMetadata?.description ?? '',
      ...Object.values(a.props).map((p) => p.description ?? ''),
    ]);
    const unknown: string[] = [];
    for (const text of texts) {
      for (const match of text.matchAll(/\b(List|Get|Find|Create|Update|Delete|Add|Remove|Search|Log|Apply|Upload|Download|Link) (?!YouTrack)[A-Z]/g)) {
        const index = match.index ?? 0;
        if (!names.some((name) => text.startsWith(name, index))) {
          unknown.push(text.slice(index, index + 40));
        }
      }
    }
    expect(unknown).toEqual([]);
    expect(texts.join(' ')).not.toContain('or Get Issue');
  });
});
