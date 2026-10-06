import { HttpError, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    createMockActionContext,
    InputPropertyMap,
    StaticPropsValue,
} from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jumpcloud } from '../src';
import { createObjectAction } from '../src/lib/actions/create-object';
import { deleteObjectAction } from '../src/lib/actions/delete-object';
import { getObjectAction } from '../src/lib/actions/get-object';
import { listObjectsAction } from '../src/lib/actions/list-objects';
import { listObjectsByIdAction } from '../src/lib/actions/list-objects-by-id';
import { searchObjectsAction } from '../src/lib/actions/search-objects';
import { updateObjectAction } from '../src/lib/actions/update-object';
import { jumpcloudAuth } from '../src/lib/auth';
import { ObjectTypeKey } from '../src/lib/common/types';

const sendRequest = vi.fn();

const V1 = 'https://console.jumpcloud.com/api';
const V2 = 'https://console.jumpcloud.com/api/v2';
const PAGING = { limit: 50, skip: 0, fetchAll: false, maxItems: 1000 };

beforeEach(() => {
    sendRequest.mockReset();
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => sendRequest(request));
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('piece definition', () => {
    it('registers every action and the custom API call', () => {
        expect(Object.keys(jumpcloud.actions())).toEqual([
            'create_object',
            'update_object',
            'delete_object',
            'get_object',
            'list_objects',
            'list_objects_by_id',
            'search_objects',
            'create_association',
            'delete_association',
            'find_user_by_employee_id',
            'lock_user',
            'unlock_user',
            'reset_user_mfa',
            'update_user_on_system',
            'run_trigger_command',
            'custom_api_call',
        ]);
    });

    it('tags every hand-written action for agents', () => {
        const actions = Object.values(jumpcloud.actions()).filter((action) => action.name !== 'custom_api_call');
        actions.forEach((action) => {
            expect(action.audience).toBe('both');
            expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(40);
            expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
            expect(action.classification).toBeDefined();
        });
    });
});

describe('Get Object by ID', () => {
    it('fetches the object and returns it flattened', async () => {
        respond({ 'GET /systemusers/u1': { _id: 'u1', username: 'jdoe', email: 'j@x.com' } });

        const result = await getObjectAction.run(context<typeof getObjectAction.props>({ objectType: 'user', objectId: ' u1 ' }));

        expect(result).toMatchObject({ id: 'u1', username: 'jdoe', email: 'j@x.com' });
    });

    it('explains a missing object', async () => {
        sendRequest.mockRejectedValue(new HttpError({}, { status: 404, responseBody: { message: 'Not Found' } }));

        await expect(getObjectAction.run(context<typeof getObjectAction.props>({ objectType: 'system', objectId: 's9' }))).rejects.toThrow(
            'JumpCloud API error (HTTP 404): Not Found',
        );
    });
});

describe('Delete Object', () => {
    it('deletes through the v2 path for groups', async () => {
        respond({ 'DELETE /v2/usergroups/g1': '' });

        const result = await deleteObjectAction.run(context<typeof deleteObjectAction.props>({ objectType: 'user_group', objectId: 'g1' }));

        expect(result).toEqual({ id: 'g1', object_type: 'user_group', deleted: true });
        expect(lastRequest()).toMatchObject({ method: HttpMethod.DELETE, url: `${V2}/usergroups/g1` });
    });
});

describe('Create Object', () => {
    it('creates a user from trimmed fields merged over additional fields', async () => {
        respond({ 'POST /systemusers': { _id: 'u1', username: 'jdoe', email: 'j@x.com', location: 'Remote' } });

        const result = await createObjectAction.run(
            context<typeof createObjectAction.props>({
                objectType: 'user',
                fields: { username: ' jdoe ', email: 'j@x.com', firstname: '', jobTitle: 'Engineer' },
                additionalFields: { location: 'Remote', username: 'ignored' },
            }),
        );

        expect(lastRequest().body).toEqual({ location: 'Remote', username: 'jdoe', email: 'j@x.com', jobTitle: 'Engineer' });
        expect(result).toMatchObject({ id: 'u1', username: 'jdoe' });
    });

    it('creates a bookmark application with an empty config by default', async () => {
        respond({ 'POST /applications': { _id: 'a1', displayLabel: 'Wiki' } });

        await createObjectAction.run(
            context<typeof createObjectAction.props>({
                objectType: 'application',
                fields: { displayLabel: 'Wiki', ssoUrl: 'https://wiki.example.com' },
                additionalFields: undefined,
            }),
        );

        expect(lastRequest().body).toEqual({ config: {}, displayLabel: 'Wiki', ssoUrl: 'https://wiki.example.com', name: 'bookmark' });
    });

    it('refuses to create systems', async () => {
        await expect(
            createObjectAction.run(context<typeof createObjectAction.props>({ objectType: 'system', fields: {}, additionalFields: undefined })),
        ).rejects.toThrow('cannot be created');
    });
});

describe('Update Object', () => {
    it('sends only the changed fields for users', async () => {
        respond({ 'PUT /systemusers/u1': { _id: 'u1', department: 'Finance' } });

        const result = await updateObjectAction.run(
            context<typeof updateObjectAction.props>({ objectType: 'user', objectId: 'u1', fields: { department: 'Finance' }, additionalFields: undefined }),
        );

        expect(sendRequest).toHaveBeenCalledTimes(1);
        expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT, url: `${V1}/systemusers/u1`, body: { department: 'Finance' } });
        expect(result).toMatchObject({ id: 'u1', department: 'Finance' });
    });

    it('merges changes into the current group because the API replaces it', async () => {
        respond({
            'GET /v2/systemgroups/g1': { id: 'g1', name: 'Macs', description: 'old', type: 'system_group', membershipMethod: 'STATIC' },
            'PUT /v2/systemgroups/g1': { id: 'g1', name: 'Macs', description: 'new' },
        });

        await updateObjectAction.run(
            context<typeof updateObjectAction.props>({
                objectType: 'system_group',
                objectId: 'g1',
                fields: { description: 'new' },
                additionalFields: undefined,
            }),
        );

        expect(lastRequest()).toMatchObject({
            method: HttpMethod.PUT,
            url: `${V2}/systemgroups/g1`,
            body: { name: 'Macs', description: 'new', membershipMethod: 'STATIC' },
        });
        expect(lastRequest().body).not.toHaveProperty('id');
        expect(lastRequest().body).not.toHaveProperty('type');
    });

    it('requires at least one change', async () => {
        await expect(
            updateObjectAction.run(
                context<typeof updateObjectAction.props>({ objectType: 'user', objectId: 'u1', fields: { email: '  ' }, additionalFields: undefined }),
            ),
        ).rejects.toThrow('Fill in at least one field');
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('List Objects (Batch)', () => {
    it('returns flattened items with paging info', async () => {
        respond({ 'GET /systemusers': { totalCount: 3, results: [{ _id: 'u1' }, { _id: 'u2' }] } });

        const result = await listObjectsAction.run(context<typeof listObjectsAction.props>({ objectType: 'user', ...PAGING, limit: 2 }));

        expect(lastRequest().queryParams).toEqual({ limit: '2', skip: '0', sort: '_id' });
        expect(result).toMatchObject({ items: [{ id: 'u1' }, { id: 'u2' }], total_count: 3, next_skip: 2 });
    });
});

describe('List Objects by ID (Batch)', () => {
    it('uses one $in filter for v1 types and keeps the requested order', async () => {
        respond({ 'GET /systems': { totalCount: 2, results: [{ _id: 's2', hostname: 'b' }, { _id: 's1', hostname: 'a' }] } });

        const result = await listObjectsByIdAction.run(
            context<typeof listObjectsByIdAction.props>({ objectType: 'system', ids: ['s1', 's2', 's1', ' ', 's3'], ...PAGING }),
        );

        expect(lastRequest().queryParams).toEqual({ limit: '3', skip: '0', sort: '_id', filter: '_id:$in:s1|s2|s3' });
        expect(result).toMatchObject({ items: [{ id: 's1' }, { id: 's2' }], missing_ids: ['s3'], total_count: 3, next_skip: null });
    });

    it('pages over the ID list', async () => {
        respond({ 'GET /systemusers': { totalCount: 1, results: [{ _id: 'b' }] } });

        const result = await listObjectsByIdAction.run(
            context<typeof listObjectsByIdAction.props>({ objectType: 'user', ids: ['a', 'b', 'c'], ...PAGING, limit: 1, skip: 1 }),
        );

        expect(lastRequest().queryParams).toMatchObject({ filter: '_id:$in:b' });
        expect(result).toMatchObject({ total_count: 3, next_skip: 2, missing_ids: [] });
    });

    it('fetches v2 groups one by one and reports the ones not found', async () => {
        sendRequest.mockImplementation(async (request: Request) => {
            if (request.url === `${V2}/usergroups/g1`) {
                return { status: 200, body: { id: 'g1', name: 'Eng' } };
            }
            throw new HttpError({}, { status: 404, responseBody: {} });
        });

        const result = await listObjectsByIdAction.run(
            context<typeof listObjectsByIdAction.props>({ objectType: 'user_group', ids: ['g1', 'g2'], ...PAGING }),
        );

        expect(result).toMatchObject({ items: [{ id: 'g1', name: 'Eng' }], missing_ids: ['g2'] });
    });

    it('does not hide errors other than not found', async () => {
        sendRequest.mockRejectedValue(new HttpError({}, { status: 403, responseBody: {} }));

        await expect(
            listObjectsByIdAction.run(context<typeof listObjectsByIdAction.props>({ objectType: 'system_group', ids: ['g1'], ...PAGING })),
        ).rejects.toThrow('HTTP 403');
    });

    it('requires at least one ID', async () => {
        await expect(
            listObjectsByIdAction.run(context<typeof listObjectsByIdAction.props>({ objectType: 'user', ids: [' '], ...PAGING })),
        ).rejects.toThrow('Add at least one Object ID.');
    });
});

describe('Search Objects (Batch)', () => {
    const base = { searchText: undefined, filterField: undefined, filterOperator: 'equals', filterValue: undefined, ...PAGING };

    it('searches users by text through the search endpoint', async () => {
        respond({ 'POST /search/systemusers': { totalCount: 1, results: [{ _id: 'u1', username: 'jdoe' }] } });

        const result = await searchObjectsAction.run(context<typeof searchObjectsAction.props>({ ...base, objectType: 'user', searchText: 'jdoe' }));

        expect(lastRequest().body).toEqual({ searchFilter: { searchTerm: 'jdoe', fields: ['username', 'email', 'firstname', 'lastname', 'displayname'] } });
        expect(result).toMatchObject({ total_count: 1, next_skip: null });
    });

    it.each(FILTER_CASES)('filters %s with the %s operator of its API version', async (objectType, filterOperator, url, filter) => {
        sendRequest.mockResolvedValue({ status: 200, body: [] });

        await searchObjectsAction.run(
            context<typeof searchObjectsAction.props>({ ...base, objectType, filterField: 'department', filterOperator, filterValue: ' Fin ' }),
        );

        expect(lastRequest()).toMatchObject({ url, queryParams: { filter } });
    });

    it('pages application text search locally', async () => {
        respond({
            'GET /applications': {
                totalCount: 3,
                results: [{ _id: 'a1', displayLabel: 'Slack A' }, { _id: 'a2', displayLabel: 'Zoom' }, { _id: 'a3', displayLabel: 'Slack B' }],
            },
        });

        const result = await searchObjectsAction.run(
            context<typeof searchObjectsAction.props>({ ...base, objectType: 'application', searchText: 'slack', limit: 1, skip: 1 }),
        );

        expect(result).toMatchObject({ items: [{ id: 'a3' }], total_count: 2, next_skip: null });
    });

    it.each([
        [{ searchText: 'a', filterField: 'b', filterValue: 'c' }, 'not both'],
        [{ filterField: 'department' }, 'Enter a Filter Value'],
        [{}, 'Enter Search Text'],
        [{ filterField: 'department', filterValue: 'x', filterOperator: 'like' }, 'Unknown Filter Operator'],
    ])('validates the inputs %o', async (input, message) => {
        await expect(searchObjectsAction.run(context<typeof searchObjectsAction.props>({ ...base, objectType: 'user', ...input }))).rejects.toThrow(
            message,
        );
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

function context<Props extends InputPropertyMap>(propsValue: StaticPropsValue<Props>) {
    return { ...createMockActionContext<Props>({ propsValue }), auth: CONNECTION };
}

function respond(routes: Record<string, unknown>): void {
    sendRequest.mockImplementation(async (request: Request) => {
        const path = request.url.replace(V1, '');
        const key = `${request.method} ${path}`;
        if (!(key in routes)) {
            throw new Error(`Unexpected request ${key}`);
        }
        return { status: 200, body: routes[key] };
    });
}

function lastRequest(): Request {
    return sendRequest.mock.calls[sendRequest.mock.calls.length - 1][0];
}

const FILTER_CASES: [ObjectTypeKey, string, string, string][] = [
    ['user', 'starts_with', `${V1}/systemusers`, 'department:$sw:Fin'],
    ['user_group', 'starts_with', `${V2}/usergroups`, 'department:search:Fin'],
    ['application', 'greater_or_equal', `${V1}/applications`, 'department:$gte:Fin'],
    ['system_group', 'in', `${V2}/systemgroups`, 'department:in:Fin'],
];

const CONNECTION: AppConnectionValueForAuthProperty<typeof jumpcloudAuth> = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { apiKey: 'key', region: 'us', orgId: undefined },
};

type Request = {
    method: string;
    url: string;
    body?: unknown;
    queryParams?: Record<string, string>;
};
