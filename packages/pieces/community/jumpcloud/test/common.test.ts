import { HttpError, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, PropertyContext } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jumpcloudAuth } from '../src/lib/auth';
import { jumpcloudApi } from '../src/lib/common/client';
import { jumpcloudObjects } from '../src/lib/common/objects';
import { jumpcloudOutput } from '../src/lib/common/output';
import { jumpcloudProps } from '../src/lib/common/props';
import { ListPage, PageRequest } from '../src/lib/common/types';

const sendRequest = vi.fn();

const AUTH = { apiKey: 'key', region: 'us', orgId: undefined };
const V1 = 'https://console.jumpcloud.com/api';
const V2 = 'https://console.jumpcloud.com/api/v2';
const HEADERS = { 'x-api-key': 'key', Accept: 'application/json' };

beforeEach(() => {
    sendRequest.mockReset();
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => sendRequest(request));
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('send', () => {
    it('builds v1 and v2 URLs with the connection headers', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { ok: true } });

        await jumpcloudApi.send({ auth: AUTH, method: HttpMethod.GET, path: '/systemusers/u1' });
        await jumpcloudApi.send({ auth: AUTH, method: HttpMethod.POST, path: '/usergroups', version: 'v2', body: { name: 'Eng' } });

        expect(sendRequest).toHaveBeenNthCalledWith(1, { method: HttpMethod.GET, url: `${V1}/systemusers/u1`, headers: HEADERS });
        expect(sendRequest).toHaveBeenNthCalledWith(2, {
            method: HttpMethod.POST,
            url: `${V2}/usergroups`,
            headers: HEADERS,
            body: { name: 'Eng' },
        });
    });

    it('turns API failures into actionable errors', async () => {
        sendRequest.mockRejectedValue(new HttpError({}, { status: 404, responseBody: { message: 'user not found' } }));

        await expect(jumpcloudApi.send({ auth: AUTH, method: HttpMethod.GET, path: '/systemusers/missing' })).rejects.toThrow(
            'JumpCloud API error (HTTP 404): user not found. Check that the object exists, and that the connection region is correct.',
        );
    });
});

describe('fetchListPage', () => {
    it('reads v1 results with their total count', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: 3, results: [{ _id: 'a' }, 'junk', { _id: 'b' }] } });

        const page = await jumpcloudApi.fetchListPage({ auth: AUTH, method: HttpMethod.GET, path: '/systemusers' });

        expect(page).toEqual({ items: [{ _id: 'a' }, { _id: 'b' }], totalCount: 3 });
    });

    it('reads v2 plain arrays without a total count', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: [{ id: 'g1' }] });

        const page = await jumpcloudApi.fetchListPage({ auth: AUTH, method: HttpMethod.GET, path: '/usergroups', version: 'v2' });

        expect(page).toEqual({ items: [{ id: 'g1' }] });
    });

    it('ignores a negative total count', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: -1, results: [] } });

        expect(await jumpcloudApi.fetchListPage({ auth: AUTH, method: HttpMethod.GET, path: '/systemusers' })).toEqual({ items: [] });
    });

    it('rejects an unexpected body', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { foo: 'bar' } });

        await expect(jumpcloudApi.fetchListPage({ auth: AUTH, method: HttpMethod.GET, path: '/systemusers' })).rejects.toThrow(
            'unexpected list response',
        );
    });
});

describe('collectPages', () => {
    it('returns one page and the next skip when more objects exist', async () => {
        const fetchPage = pagesOf({ total: 250, withTotalCount: true });

        const result = await jumpcloudApi.collectPages({ fetchPage, limit: 20, skip: 40 });

        expect(fetchPage).toHaveBeenCalledTimes(1);
        expect(fetchPage).toHaveBeenCalledWith({ limit: 20, skip: 40 });
        expect(result.items.map((item) => item['_id'])).toEqual(range(40, 60));
        expect(result).toMatchObject({ total_count: 250, next_skip: 60 });
    });

    it('stops at the end of the collection', async () => {
        const result = await jumpcloudApi.collectPages({ fetchPage: pagesOf({ total: 5, withTotalCount: true }), limit: 50 });

        expect(result.items).toHaveLength(5);
        expect(result).toMatchObject({ total_count: 5, next_skip: null });
    });

    it('fetches every page up to the end when Fetch All Pages is on', async () => {
        const fetchPage = pagesOf({ total: 230, withTotalCount: false });

        const result = await jumpcloudApi.collectPages({ fetchPage, fetchAll: true, maxItems: 1000 });

        expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([
            { limit: 100, skip: 0 },
            { limit: 100, skip: 100 },
            { limit: 100, skip: 200 },
        ]);
        expect(result.items).toHaveLength(230);
        expect(result).toEqual(expect.objectContaining({ total_count: null, next_skip: null }));
    });

    it('stops at Max Objects and reports where to continue', async () => {
        const fetchPage = pagesOf({ total: 1000, withTotalCount: true });

        const result = await jumpcloudApi.collectPages({ fetchPage, fetchAll: true, maxItems: 150 });

        expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([
            { limit: 100, skip: 0 },
            { limit: 50, skip: 100 },
        ]);
        expect(result).toMatchObject({ total_count: 1000, next_skip: 150 });
        expect(result.items).toHaveLength(150);
    });

    it('clamps out-of-range inputs', async () => {
        const fetchPage = pagesOf({ total: 1000, withTotalCount: true });

        await jumpcloudApi.collectPages({ fetchPage, limit: 5000, skip: -3 });
        await jumpcloudApi.collectPages({ fetchPage, limit: 0 });
        await jumpcloudApi.collectPages({ fetchPage, limit: Number.NaN });

        expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([
            { limit: 100, skip: 0 },
            { limit: 1, skip: 0 },
            { limit: 50, skip: 0 },
        ]);
    });
});

describe('objects', () => {
    it('lists only creatable types when asked', () => {
        expect(jumpcloudObjects.typeOptions({ creatableOnly: false }).map((option) => option.value)).toEqual([
            'user',
            'system',
            'user_group',
            'system_group',
            'application',
        ]);
        expect(jumpcloudObjects.typeOptions({ creatableOnly: true }).map((option) => option.value)).not.toContain('system');
    });

    it('guards object type values', () => {
        expect(jumpcloudObjects.isObjectType('user_group')).toBe(true);
        expect(jumpcloudObjects.isObjectType('toString')).toBe(false);
        expect(jumpcloudObjects.isObjectType(undefined)).toBe(false);
    });

    it('builds item paths and rejects a blank ID', () => {
        expect(jumpcloudObjects.itemPath({ type: 'system_group', id: ' a/b ' })).toBe('/systemgroups/a%2Fb');
        expect(() => jumpcloudObjects.itemPath({ type: 'user', id: '  ' })).toThrow('Select or enter the User ID.');
    });

    it('reads the ID field of each type', () => {
        expect(jumpcloudObjects.readId({ type: 'user', record: { _id: 'u1', id: 'x' } })).toBe('u1');
        expect(jumpcloudObjects.readId({ type: 'user_group', record: { _id: 'x', id: 'g1' } })).toBe('g1');
        expect(jumpcloudObjects.readId({ type: 'application', record: {} })).toBeNull();
    });

    it('lists with a stable sort and an optional filter', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: [] });

        await jumpcloudObjects.listPage({ auth: AUTH, type: 'user_group', page: { limit: 10, skip: 20 }, filter: 'name:eq:Eng' });
        await jumpcloudObjects.listPage({ auth: AUTH, type: 'system', page: { limit: 5, skip: 0 } });

        expect(sendRequest).toHaveBeenNthCalledWith(1, {
            method: HttpMethod.GET,
            url: `${V2}/usergroups`,
            headers: HEADERS,
            queryParams: { limit: '10', skip: '20', sort: 'name', filter: 'name:eq:Eng' },
        });
        expect(sendRequest).toHaveBeenNthCalledWith(2, {
            method: HttpMethod.GET,
            url: `${V1}/systems`,
            headers: HEADERS,
            queryParams: { limit: '5', skip: '0', sort: '_id' },
        });
    });

    it('searches users and systems through the search endpoints', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: 0, results: [] } });

        await jumpcloudObjects.searchPage({ auth: AUTH, type: 'user', term: ' jane ', page: { limit: 50, skip: 0 } });

        expect(sendRequest).toHaveBeenCalledWith({
            method: HttpMethod.POST,
            url: `${V1}/search/systemusers`,
            headers: HEADERS,
            queryParams: { limit: '50', skip: '0' },
            body: { searchFilter: { searchTerm: 'jane', fields: ['username', 'email', 'firstname', 'lastname', 'displayname'] } },
        });
    });

    it('searches groups with the v2 search filter', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: [] });

        await jumpcloudObjects.searchPage({ auth: AUTH, type: 'system_group', term: 'mac', page: { limit: 50, skip: 0 } });

        expect(sendRequest.mock.calls[0][0]).toMatchObject({ url: `${V2}/systemgroups`, queryParams: { filter: 'name:search:mac' } });
    });

    it('filters applications locally, ignoring case', async () => {
        sendRequest.mockResolvedValue({
            status: 200,
            body: { totalCount: 2, results: [{ _id: 'a1', displayLabel: 'Slack' }, { _id: 'a2', displayLabel: 'Zoom' }] },
        });

        const page = await jumpcloudObjects.searchPage({ auth: AUTH, type: 'application', term: 'sla', page: { limit: 50, skip: 0 } });

        expect(page.items).toEqual([{ _id: 'a1', displayLabel: 'Slack' }]);
        expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ limit: '100', skip: '0', sort: 'displayLabel' });
    });

    it('lists by picker sort when the search term is empty', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: 0, results: [] } });

        await jumpcloudObjects.searchPage({ auth: AUTH, type: 'user', term: '  ', page: { limit: 50, skip: 0 } });

        expect(sendRequest.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: `${V1}/systemusers`, queryParams: { sort: 'username' } });
    });

    it.each([
        ['user', { _id: 'u1', firstname: 'Jane', lastname: 'Doe', email: 'jane@x.com' }, 'Jane Doe (jane@x.com)'],
        ['user', { _id: 'u1', displayname: 'JD', username: 'jdoe' }, 'JD'],
        ['user', { _id: 'u1', username: 'jdoe' }, 'jdoe'],
        ['system', { _id: 's1', hostname: 'mac-01', os: 'Mac OS X' }, 'mac-01 (Mac OS X)'],
        ['system', { _id: 's1' }, 's1'],
        ['user_group', { id: 'g1', name: 'Engineering' }, 'Engineering'],
        ['application', { _id: 'a1', name: 'slack', displayLabel: 'Slack' }, 'Slack'],
    ] as const)('labels a %s as %s', (type, record, label) => {
        expect(jumpcloudObjects.optionLabel({ type, record })).toBe(label);
    });
});

describe('output', () => {
    it('flattens a user with consistent keys', () => {
        const flat = jumpcloudOutput.flatten({
            type: 'user',
            record: { _id: 'u1', username: 'jdoe', email: 'j@x.com', account_locked: false, mfa: { configured: true }, employeeIdentifier: 'E1' },
        });

        expect(flat).toMatchObject({ id: 'u1', username: 'jdoe', account_locked: false, mfa_configured: true, employee_id: 'E1', department: null });
        expect(Object.keys(jumpcloudOutput.flatten({ type: 'user', record: {} }))).toEqual(Object.keys(flat));
    });

    it('flattens systems, groups and applications', () => {
        expect(jumpcloudOutput.flatten({ type: 'system', record: { _id: 's1', hostname: 'mac', active: true } })).toMatchObject({
            id: 's1',
            hostname: 'mac',
            active: true,
            serial_number: null,
        });
        expect(jumpcloudOutput.flatten({ type: 'system_group', record: { id: 'g1', name: 'Macs', membershipMethod: 'STATIC' } })).toEqual({
            id: 'g1',
            name: 'Macs',
            description: null,
            email: null,
            type: null,
            membership_method: 'STATIC',
        });
        expect(jumpcloudOutput.flatten({ type: 'application', record: { _id: 'a1', displayLabel: 'Slack' } })).toMatchObject({
            id: 'a1',
            display_label: 'Slack',
        });
    });
});

describe('objectId dropdown', () => {
    const dropdown = jumpcloudProps.objectId();

    it('asks for a connection and a type first', async () => {
        expect(await dropdown.options({ auth: undefined, objectType: 'user' }, propertyContext())).toMatchObject({
            disabled: true,
            placeholder: 'Connect your JumpCloud account first.',
        });
        expect(await dropdown.options({ auth: CONNECTION, objectType: undefined }, propertyContext())).toMatchObject({
            disabled: true,
            placeholder: 'Select an object type first.',
        });
    });

    it('offers labelled options from a search', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: 1, results: [{ _id: 'u1', username: 'jdoe', email: 'j@x.com' }, { foo: 1 }] } });

        const state = await dropdown.options({ auth: CONNECTION, objectType: 'user' }, propertyContext('jd'));

        expect(state).toEqual({ disabled: false, options: [{ label: 'jdoe (j@x.com)', value: 'u1' }], placeholder: undefined });
        expect(sendRequest.mock.calls[0][0].url).toBe(`${V1}/search/systemusers`);
    });

    it('shows the API error instead of failing', async () => {
        sendRequest.mockRejectedValue(new HttpError({}, { status: 401, responseBody: {} }));

        const state = await dropdown.options({ auth: CONNECTION, objectType: 'user_group' }, propertyContext());

        expect(state).toMatchObject({ disabled: true, options: [], placeholder: expect.stringContaining('HTTP 401') });
    });
});

function pagesOf({ total, withTotalCount }: { total: number; withTotalCount: boolean }) {
    return vi.fn(async ({ limit, skip }: PageRequest): Promise<ListPage> => {
        const items = range(skip, Math.min(total, skip + limit)).map((index) => ({ _id: index }));
        return withTotalCount ? { items, totalCount: total } : { items };
    });
}

function range(start: number, end: number): number[] {
    return Array.from({ length: Math.max(0, end - start) }, (_, index) => start + index);
}

function propertyContext(searchValue?: string): PropertyContext {
    const { server, project, flows, connections } = createMockActionContext({ propsValue: {} });
    return { server, project, flows, connections, searchValue };
}

const CONNECTION: AppConnectionValueForAuthProperty<typeof jumpcloudAuth> = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { apiKey: 'key', region: 'us', orgId: undefined },
};
