import { HttpMethod } from '@activepieces/pieces-common';
import { jumpcloudApi, MAX_PAGE_SIZE } from './client';
import { ApiRecord, ConnectionProps, ListPage, ObjectTypeConfig, ObjectTypeKey, PageRequest } from './types';

export const jumpcloudObjects = {
    config,
    isObjectType,
    parseType,
    typeOptions,
    itemPath,
    readId,
    listPage,
    searchPage,
    optionLabel,
    getRecord,
    listByIds,
    createdAt,
    sortsByCreated,
    listAll,
    listCreatedSince,
};

function config(type: ObjectTypeKey): ObjectTypeConfig {
    return OBJECT_TYPES[type];
}

function isObjectType(value: unknown): value is ObjectTypeKey {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(OBJECT_TYPES, value);
}

function parseType(value: unknown): ObjectTypeKey {
    if (!isObjectType(value)) {
        throw new Error('Select a valid Object Type: User, System (device), User Group, Device Group or Application (SSO).');
    }
    return value;
}

function typeOptions({ creatableOnly }: { creatableOnly: boolean }): { label: string; value: ObjectTypeKey }[] {
    return OBJECT_TYPE_KEYS.filter((type) => !creatableOnly || OBJECT_TYPES[type].canCreate).map((type) => ({
        label: OBJECT_TYPES[type].label,
        value: type,
    }));
}

function itemPath({ type, id }: { type: ObjectTypeKey; id: string }): string {
    const trimmed = id.trim();
    if (trimmed.length === 0) {
        throw new Error(`Select or enter the ${OBJECT_TYPES[type].label} ID.`);
    }
    return `${OBJECT_TYPES[type].path}/${encodeURIComponent(trimmed)}`;
}

function readId({ type, record }: { type: ObjectTypeKey; record: ApiRecord }): string | null {
    const value = record[OBJECT_TYPES[type].idField];
    return typeof value === 'string' && value.length > 0 ? value : null;
}

async function listPage({ auth, type, page, filter, sort }: ListParams): Promise<ListPage> {
    const { path, version, defaultSort } = OBJECT_TYPES[type];
    return jumpcloudApi.fetchListPage({
        auth,
        method: HttpMethod.GET,
        path,
        version,
        queryParams: {
            limit: String(page.limit),
            skip: String(page.skip),
            sort: sort ?? defaultSort,
            ...(filter === undefined ? {} : { filter }),
        },
    });
}

async function searchPage({ auth, type, term, page }: SearchParams): Promise<ListPage> {
    const trimmed = term.trim();
    if (trimmed.length === 0) {
        return listPage({ auth, type, page, sort: OBJECT_TYPES[type].pickerSort });
    }
    const search = OBJECT_TYPES[type].search;
    switch (search.kind) {
        case 'endpoint':
            return jumpcloudApi.fetchListPage({
                auth,
                method: HttpMethod.POST,
                path: search.path,
                queryParams: { limit: String(page.limit), skip: String(page.skip) },
                body: { searchFilter: { searchTerm: trimmed, fields: search.fields } },
            });
        case 'filter':
            return listPage({ auth, type, page, filter: `${search.field}:${search.operator}:${trimmed}` });
        case 'local': {
            const all = await listAll({ auth, type, sort: OBJECT_TYPES[type].pickerSort });
            const needle = trimmed.toLowerCase();
            const matches = all.filter((record) => optionLabel({ type, record }).toLowerCase().includes(needle));
            return { items: matches.slice(page.skip, page.skip + page.limit), totalCount: matches.length };
        }
    }
}

async function getRecord({ auth, type, id }: { auth: ConnectionProps; type: ObjectTypeKey; id: string }): Promise<ApiRecord> {
    const body = await jumpcloudApi.send<unknown>({
        auth,
        method: HttpMethod.GET,
        path: itemPath({ type, id }),
        version: OBJECT_TYPES[type].version,
    });
    if (!jumpcloudApi.isRecord(body)) {
        throw new Error(`JumpCloud returned an unexpected response for ${OBJECT_TYPES[type].label} ${id}.`);
    }
    return body;
}

async function listByIds({ auth, type, ids }: { auth: ConnectionProps; type: ObjectTypeKey; ids: string[] }): Promise<ApiRecord[]> {
    if (ids.length === 0) {
        return [];
    }
    const { version, idField } = OBJECT_TYPES[type];
    if (version === 'v1') {
        const page = await listPage({ auth, type, page: { limit: ids.length, skip: 0 }, filter: `${idField}:$in:${ids.join('|')}` });
        return page.items;
    }
    const batches = Array.from({ length: Math.ceil(ids.length / PARALLEL_FETCHES) }, (_, index) =>
        ids.slice(index * PARALLEL_FETCHES, (index + 1) * PARALLEL_FETCHES),
    );
    const results = await batches.reduce<Promise<ApiRecord[]>>(async (previous, batch) => {
        const collected = await previous;
        const fetched = await Promise.all(batch.map((id) => getRecordOrNull({ auth, type, id })));
        return [...collected, ...fetched.filter((record): record is ApiRecord => record !== null)];
    }, Promise.resolve([]));
    return results;
}

async function getRecordOrNull({ auth, type, id }: { auth: ConnectionProps; type: ObjectTypeKey; id: string }): Promise<ApiRecord | null> {
    try {
        return await getRecord({ auth, type, id });
    } catch (error) {
        if (jumpcloudApi.isNotFound(error)) {
            return null;
        }
        throw error;
    }
}

function createdAt({ type, record }: { type: ObjectTypeKey; record: ApiRecord }): number | null {
    const created = record['created'];
    if (typeof created === 'string') {
        const parsed = Date.parse(created);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    const id = readId({ type, record });
    return id !== null && OBJECT_ID_PATTERN.test(id) ? parseInt(id.slice(0, 8), 16) * 1000 : null;
}

function sortsByCreated(type: ObjectTypeKey): boolean {
    return OBJECT_TYPES[type].sortsByCreated;
}

async function listAll({ auth, type, sort }: { auth: ConnectionProps; type: ObjectTypeKey; sort?: string }): Promise<ApiRecord[]> {
    return collectUntil({ auth, type, sort: sort ?? OBJECT_TYPES[type].defaultSort, skip: 0, collected: [], done: () => false });
}

async function listCreatedSince({ auth, type, since, maxItems }: CreatedSinceParams): Promise<ApiRecord[]> {
    return collectUntil({
        auth,
        type,
        sort: '-created',
        skip: 0,
        collected: [],
        done: (page, collected) => {
            const oldest = page.length === 0 ? null : createdAt({ type, record: page[page.length - 1] });
            return (oldest !== null && oldest < since) || (maxItems !== undefined && collected.length >= maxItems);
        },
    });
}

async function collectUntil({ auth, type, sort, skip, collected, done }: CollectUntilParams): Promise<ApiRecord[]> {
    const page = await listPage({ auth, type, page: { limit: MAX_PAGE_SIZE, skip }, sort });
    const items = [...collected, ...page.items];
    if (page.items.length < MAX_PAGE_SIZE || done(page.items, items)) {
        return items;
    }
    return collectUntil({ auth, type, sort, skip: skip + page.items.length, collected: items, done });
}

function optionLabel({ type, record }: { type: ObjectTypeKey; record: ApiRecord }): string {
    const id = readId({ type, record }) ?? 'unknown ID';
    switch (type) {
        case 'user': {
            const fullName = [text(record['firstname']), text(record['lastname'])].filter((part) => part.length > 0).join(' ');
            const name = firstNonEmpty([text(record['displayname']), fullName, text(record['username'])]) ?? id;
            const email = text(record['email']);
            return email.length > 0 ? `${name} (${email})` : name;
        }
        case 'system': {
            const name = firstNonEmpty([text(record['displayName']), text(record['hostname'])]) ?? id;
            const os = text(record['os']);
            return os.length > 0 ? `${name} (${os})` : name;
        }
        case 'user_group':
        case 'system_group':
            return firstNonEmpty([text(record['name'])]) ?? id;
        case 'application':
            return firstNonEmpty([text(record['displayLabel']), text(record['displayName']), text(record['name'])]) ?? id;
    }
}

function text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function firstNonEmpty(values: string[]): string | undefined {
    return values.find((value) => value.length > 0);
}

const OBJECT_TYPES: Record<ObjectTypeKey, ObjectTypeConfig & { pickerSort: string; sortsByCreated: boolean }> = {
    user: {
        label: 'User',
        version: 'v1',
        path: '/systemusers',
        idField: '_id',
        defaultSort: '_id',
        pickerSort: 'username',
        sortsByCreated: true,
        canCreate: true,
        replaceOnUpdate: false,
        search: { kind: 'endpoint', path: '/search/systemusers', fields: ['username', 'email', 'firstname', 'lastname', 'displayname'] },
    },
    system: {
        label: 'System (device)',
        version: 'v1',
        path: '/systems',
        idField: '_id',
        defaultSort: '_id',
        pickerSort: 'displayName',
        sortsByCreated: true,
        canCreate: false,
        replaceOnUpdate: false,
        search: { kind: 'endpoint', path: '/search/systems', fields: ['displayName', 'hostname', 'serialNumber'] },
    },
    user_group: {
        label: 'User Group',
        version: 'v2',
        path: '/usergroups',
        idField: 'id',
        defaultSort: 'name',
        pickerSort: 'name',
        sortsByCreated: false,
        canCreate: true,
        replaceOnUpdate: true,
        search: { kind: 'filter', field: 'name', operator: 'search' },
    },
    system_group: {
        label: 'Device Group',
        version: 'v2',
        path: '/systemgroups',
        idField: 'id',
        defaultSort: 'name',
        pickerSort: 'name',
        sortsByCreated: false,
        canCreate: true,
        replaceOnUpdate: true,
        search: { kind: 'filter', field: 'name', operator: 'search' },
    },
    application: {
        label: 'Application (SSO)',
        version: 'v1',
        path: '/applications',
        idField: '_id',
        defaultSort: '_id',
        pickerSort: 'displayLabel',
        sortsByCreated: true,
        canCreate: true,
        replaceOnUpdate: true,
        search: { kind: 'local' },
    },
};

const PARALLEL_FETCHES = 10;
const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

const OBJECT_TYPE_KEYS: ObjectTypeKey[] = ['user', 'system', 'user_group', 'system_group', 'application'];

type ListParams = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    page: PageRequest;
    filter?: string;
    sort?: string;
};

type CreatedSinceParams = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    since: number;
    maxItems?: number;
};

type CollectUntilParams = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    sort: string;
    skip: number;
    collected: ApiRecord[];
    done: (page: ApiRecord[], collected: ApiRecord[]) => boolean;
};

type SearchParams = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    term: string;
    page: PageRequest;
};
