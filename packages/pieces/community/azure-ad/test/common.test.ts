import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import {
    assertGraphUrl,
    callGraphApi,
    escapeODataString,
    fetchAllGraphPages,
    fetchGraphPage,
    groupDropdown,
    userDropdown,
} from '../src/lib/common';
import { azureAdAuth } from '../src/lib/auth';
import { listGroupMembersForDropdown } from '../src/lib/common';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

function respond({ body }: { body: unknown }) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function fail({ status, body, requestBody }: { status: number; body: unknown; requestBody?: unknown }) {
    sendRequest.mockRejectedValueOnce(new HttpError(requestBody, { status, responseBody: body }));
}

const AUTH = { access_token: 'tok', type: 'OAUTH2', props: {} };

beforeEach(() => sendRequest.mockReset());

describe('callGraphApi', () => {
    it('sends to Graph with bearer token, redaction and timeout', async () => {
        respond({ body: { id: 'u1' } });
        await callGraphApi('tok', { method: HttpMethod.GET, url: '/users/u1', query: { $select: 'id' } });
        const req = sendRequest.mock.calls[0][0];
        expect(req.url).toBe('https://graph.microsoft.com/v1.0/users/u1?%24select=id');
        expect(req.headers.Authorization).toBe('Bearer tok');
        expect(req.redactBodyInErrors).toBe(true);
        expect(req.timeout).toBe(60000);
    });

    it('maps HttpError to a clean message with Graph code and message and no request body', async () => {
        fail({
            status: 400,
            body: { error: { code: 'Request_BadRequest', message: 'Password too weak', innerError: { 'request-id': 'r-1' } } },
            requestBody: { passwordProfile: { password: 'S3cret!pass' } },
        });
        const err = await callGraphApi('tok', { method: HttpMethod.POST, url: '/users', body: { passwordProfile: { password: 'S3cret!pass' } } }).catch((e: unknown) => e);
        expect(err).toBeInstanceOf(Error);
        const message = err instanceof Error ? err.message : '';
        expect(message).toBe('Microsoft Graph POST /users failed (400): Request_BadRequest: Password too weak (request-id r-1).');
        expect(message).not.toContain('S3cret');
        expect(err).not.toHaveProperty('response');
        expect(err).not.toHaveProperty('body');
    });

    it('adds a reconnect hint on 401 and a permission hint on 403', async () => {
        fail({ status: 401, body: { error: { code: 'InvalidAuthenticationToken', message: 'expired' } } });
        await expect(callGraphApi('tok', { method: HttpMethod.GET, url: '/me' })).rejects.toThrow(/\(401\).*Reconnect/);
        fail({ status: 403, body: { error: { code: 'Authorization_RequestDenied', message: 'Insufficient privileges' } } });
        await expect(callGraphApi('tok', { method: HttpMethod.GET, url: '/me' })).rejects.toThrow(/\(403\).*Permissions preset/);
    });

    it('says a write may have been applied on a transport error', async () => {
        sendRequest.mockRejectedValueOnce(new Error('socket hang up'));
        await expect(callGraphApi('tok', { method: HttpMethod.PATCH, url: '/users/u1', body: {} })).rejects.toThrow(/did not complete: socket hang up\. The change may still have been applied/);
    });

    it('refuses absolute URLs outside Graph', async () => {
        await expect(callGraphApi('tok', { method: HttpMethod.GET, url: 'https://graph.microsoft.com.evil.io/v1.0/users' })).rejects.toThrow(/would leave/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('says Invalid ID, not cursor, when an ID path escapes /v1.0/', async () => {
        const err = await callGraphApi('tok', { method: HttpMethod.GET, url: '/users/../../me' }).catch((e: unknown) => e);
        const message = err instanceof Error ? err.message : '';
        expect(message).toMatch(/^Invalid ID: the request path "\/users\/\.\.\/\.\.\/me"/);
        expect(message).not.toMatch(/cursor/i);
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('assertGraphUrl', () => {
    it('accepts a Graph nextLink', () => {
        expect(assertGraphUrl('https://graph.microsoft.com/v1.0/users?$skiptoken=abc')).toContain('graph.microsoft.com/v1.0/users');
    });
    it('uses the cursor message for cursors', () => {
        expect(() => assertGraphUrl('https://evil.io/v1.0/users')).toThrow(/^Invalid cursor:/);
    });
    it.each([
        'http://graph.microsoft.com/v1.0/users',
        'https://graph.microsoft.com.evil.io/v1.0/users',
        'https://user@graph.microsoft.com/v1.0/users',
        'https://graph.microsoft.com/beta/users',
        '//evil.io/v1.0/users',
        'not a url',
    ])('rejects %s', (url) => {
        expect(() => assertGraphUrl(url)).toThrow();
    });
});

describe('paging', () => {
    it('fetchGraphPage returns items and the next cursor, and follows a cursor as-is', async () => {
        respond({ body: { value: [{ id: '1' }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?$skiptoken=x' } });
        const page = await fetchGraphPage({ accessToken: 'tok', url: '/users', query: { $top: '1' } });
        expect(page).toEqual({ items: [{ id: '1' }], next_cursor: 'https://graph.microsoft.com/v1.0/users?$skiptoken=x', has_more: true });
        respond({ body: { value: [{ id: '2' }] } });
        const next = await fetchGraphPage({ accessToken: 'tok', url: '/users', query: { $top: '1' }, cursor: page.next_cursor ?? undefined });
        expect(sendRequest.mock.calls[1][0].url).toBe('https://graph.microsoft.com/v1.0/users?$skiptoken=x');
        expect(next).toEqual({ items: [{ id: '2' }], next_cursor: null, has_more: false });
    });

    it('fetchAllGraphPages throws when the cap is hit', async () => {
        respond({ body: { value: [{ id: '1' }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?p=2' } });
        respond({ body: { value: [{ id: '2' }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?p=3' } });
        await expect(fetchAllGraphPages({ accessToken: 'tok', url: '/users', maxPages: 2, tooManyMessage: 'too many' })).rejects.toThrow('too many');
        expect(sendRequest).toHaveBeenCalledTimes(2);
    });

    it('escapes OData quotes', () => {
        expect(escapeODataString("O'Brien")).toBe("O''Brien");
    });
});

describe('group member search', () => {
    it('sends the search to Graph with $search and eventual consistency', async () => {
        respond({ body: { value: [{ id: 'm1', displayName: 'Ada' }] } });
        const res = await listGroupMembersForDropdown({ accessToken: 'tok', groupId: 'g/1', search: ' Ada"\\ ' });
        const req = sendRequest.mock.calls[0][0];
        expect(decodeURIComponent(req.url)).toBe('https://graph.microsoft.com/v1.0/groups/g/1/members?$top=999&$select=id,displayName,userPrincipalName,mail&$search="displayName:Ada" OR "mail:Ada"&$count=true');
        expect(req.url).toContain('/groups/g%2F1/members');
        expect(req.headers.ConsistencyLevel).toBe('eventual');
        expect(res).toEqual({ items: [{ id: 'm1', displayName: 'Ada' }], truncated: false });
    });

    it('falls back to listing and filtering locally when Graph rejects the search', async () => {
        fail({ status: 400, body: { error: { code: 'Request_UnsupportedQuery', message: 'no' } } });
        respond({ body: { value: [{ id: 'm1', displayName: 'Ada' }, { id: 'm2', displayName: 'Bob' }] } });
        const res = await listGroupMembersForDropdown({ accessToken: 'tok', groupId: 'g1', search: 'ad' });
        expect(decodeURIComponent(sendRequest.mock.calls[1][0].url)).toBe('https://graph.microsoft.com/v1.0/groups/g1/members?$top=999&$select=id,displayName,userPrincipalName,mail');
        expect(res.items).toEqual([{ id: 'm1', displayName: 'Ada' }]);
    });

    it('lists without $search when there is no term', async () => {
        respond({ body: { value: [] } });
        await listGroupMembersForDropdown({ accessToken: 'tok', groupId: 'g1' });
        expect(sendRequest.mock.calls[0][0].url).not.toContain('search');
    });
});

describe('dropdowns', () => {
    const ctx = { server: { apiUrl: '', publicUrl: '', token: '' }, project: { id: 'p', externalId: async () => undefined }, flows: { list: async () => ({ data: [], next: null, previous: null }), current: { id: 'f', version: { id: 'v' } } }, connections: { get: async () => null } };

    it('user dropdown follows pages and searches with an escaped startswith filter', async () => {
        respond({ body: { value: [{ id: 'u1', displayName: "O'Brien", userPrincipalName: 'ob@x.com' }] } });
        const res = await userDropdown.options({ auth: AUTH }, { ...ctx, searchValue: "O'B" });
        const req = sendRequest.mock.calls[0][0];
        expect(decodeURIComponent(req.url)).toContain("$filter=startswith(displayName,'O''B') or startswith(userPrincipalName,'O''B') or startswith(mail,'O''B')");
        expect(req.headers.ConsistencyLevel).toBe('eventual');
        expect(res.options).toEqual([{ label: "O'Brien (ob@x.com)", value: 'u1' }]);
    });

    it('group dropdown shows the Graph error instead of swallowing it', async () => {
        fail({ status: 403, body: { error: { code: 'Authorization_RequestDenied', message: 'Insufficient privileges' } } });
        const res = await groupDropdown.options({ auth: AUTH }, ctx);
        expect(res.disabled).toBe(true);
        expect(res.placeholder).toContain('Insufficient privileges');
    });

    it('stops after five pages and says the list is truncated', async () => {
        for (let i = 0; i < 5; i++) {
            respond({ body: { value: [{ id: `g${i}` }], '@odata.nextLink': `https://graph.microsoft.com/v1.0/groups?p=${i + 2}` } });
        }
        const res = await groupDropdown.options({ auth: AUTH }, ctx);
        expect(sendRequest).toHaveBeenCalledTimes(5);
        expect(res.options).toHaveLength(5);
        expect(res.placeholder).toContain('Type to search');
    });
});

describe('auth validate', () => {
    const validate = azureAdAuth.validate;
    const server = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };
    it.each([
        [401, /rejected \(401\)/],
        [403, /not allowed .* \(403\)/],
        [503, /unavailable or throttling requests \(503\)/],
        [400, /returned 400/],
    ])('gives a distinct message for %s', async (status, pattern) => {
        fail({ status, body: { error: { code: 'X', message: 'vendor text' } } });
        const res = await validate?.({ auth: AUTH, server });
        expect(res?.valid).toBe(false);
        const error = res && !res.valid ? res.error : '';
        expect(error).toMatch(pattern);
        expect(error).toContain('X: vendor text');
    });
    it('reports network failures separately', async () => {
        sendRequest.mockRejectedValueOnce(new Error('ENOTFOUND'));
        const res = await validate?.({ auth: AUTH, server });
        expect(res && !res.valid ? res.error : '').toMatch(/Could not reach Microsoft Graph/);
    });
    it('accepts a working token', async () => {
        respond({ body: { id: 'me' } });
        expect(await validate?.({ auth: AUTH, server })).toEqual({ valid: true });
        expect(sendRequest.mock.calls[0][0].url).toBe('https://graph.microsoft.com/v1.0/me?$select=id');
    });
});
