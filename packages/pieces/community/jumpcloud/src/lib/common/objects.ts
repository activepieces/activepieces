import { HttpMethod } from '@activepieces/pieces-common';
import { jumpcloudApi, MAX_PAGE_SIZE } from './client';
import { ApiRecord, ConnectionProps, ListPage, ObjectTypeConfig, ObjectTypeKey, PageRequest } from './types';

export const jumpcloudObjects = {
    config,
    isObjectType,
    typeOptions,
    itemPath,
    readId,
    listPage,
    searchPage,
    optionLabel,
};

function config(type: ObjectTypeKey): ObjectTypeConfig {
    return OBJECT_TYPES[type];
}

function isObjectType(value: unknown): value is ObjectTypeKey {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(OBJECT_TYPES, value);
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
            const all = await listPage({ auth, type, page: { limit: MAX_PAGE_SIZE, skip: 0 }, sort: OBJECT_TYPES[type].pickerSort });
            const needle = trimmed.toLowerCase();
            return { items: all.items.filter((record) => optionLabel({ type, record }).toLowerCase().includes(needle)) };
        }
    }
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

const OBJECT_TYPES: Record<ObjectTypeKey, ObjectTypeConfig & { pickerSort: string }> = {
    user: {
        label: 'User',
        version: 'v1',
        path: '/systemusers',
        idField: '_id',
        defaultSort: '_id',
        pickerSort: 'username',
        canCreate: true,
        search: { kind: 'endpoint', path: '/search/systemusers', fields: ['username', 'email', 'firstname', 'lastname', 'displayname'] },
    },
    system: {
        label: 'System (device)',
        version: 'v1',
        path: '/systems',
        idField: '_id',
        defaultSort: '_id',
        pickerSort: 'displayName',
        canCreate: false,
        search: { kind: 'endpoint', path: '/search/systems', fields: ['displayName', 'hostname', 'serialNumber'] },
    },
    user_group: {
        label: 'User Group',
        version: 'v2',
        path: '/usergroups',
        idField: 'id',
        defaultSort: 'name',
        pickerSort: 'name',
        canCreate: true,
        search: { kind: 'filter', field: 'name', operator: 'search' },
    },
    system_group: {
        label: 'Device Group',
        version: 'v2',
        path: '/systemgroups',
        idField: 'id',
        defaultSort: 'name',
        pickerSort: 'name',
        canCreate: true,
        search: { kind: 'filter', field: 'name', operator: 'search' },
    },
    application: {
        label: 'Application (SSO)',
        version: 'v1',
        path: '/applications',
        idField: '_id',
        defaultSort: '_id',
        pickerSort: 'displayLabel',
        canCreate: true,
        search: { kind: 'local' },
    },
};

const OBJECT_TYPE_KEYS: ObjectTypeKey[] = ['user', 'system', 'user_group', 'system_group', 'application'];

type ListParams = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    page: PageRequest;
    filter?: string;
    sort?: string;
};

type SearchParams = {
    auth: ConnectionProps;
    type: ObjectTypeKey;
    term: string;
    page: PageRequest;
};
