import { OutputSchema, Property, Store } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { azureAdAuth } from './auth';

export async function callGraphApi<T>(
    accessToken: string,
    request: {
        method: HttpMethod;
        url: string;
        body?: object;
        query?: Record<string, string>;
        headers?: Record<string, string>;
    },
): Promise<T> {
    let url = resolveGraphUrl(request.url);
    if (request.query && Object.keys(request.query).length > 0) {
        const search = new URLSearchParams(request.query).toString().replace(/\+/g, '%20');
        url += (url.includes('?') ? '&' : '?') + search;
    }
    const req: HttpRequest = {
        method: request.method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...request.headers,
        },
        timeout: GRAPH_TIMEOUT_MS,
        redactBodyInErrors: true,
    };
    if (request.body !== undefined) {
        req.body = request.body;
    }
    try {
        const res = await httpClient.sendRequest<T>(req);
        return res.body;
    } catch (error) {
        throw toGraphApiError({ error, method: request.method, url });
    }
}

export function resolveGraphUrl(url: string): string {
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
        ? url
        : `${GRAPH_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
    const checked = checkGraphUrl(absolute);
    if (checked === null) {
        throw new Error(`Invalid ID: the request path "${describeRawPath(url)}" would leave https://graph.microsoft.com/v1.0/. Pass the object ID or user principal name exactly, without "/" or ".." segments.`);
    }
    return checked;
}

export function assertGraphUrl(url: string): string {
    const checked = checkGraphUrl(url);
    if (checked === null) {
        throw new Error('Invalid cursor: the cursor must point to https://graph.microsoft.com/v1.0/. Pass the next_cursor value exactly as returned.');
    }
    return checked;
}

function checkGraphUrl(url: string): string | null {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }
    if (
        parsed.protocol !== 'https:' ||
        parsed.origin !== GRAPH_ORIGIN ||
        parsed.username !== '' ||
        parsed.password !== '' ||
        !parsed.pathname.startsWith('/v1.0/') ||
        parsed.pathname.includes('..')
    ) {
        return null;
    }
    return parsed.toString();
}

function describeRawPath(url: string): string {
    return url.replace(GRAPH_BASE, '').slice(0, 200);
}

export function graphErrorDetail({ status, body }: { status: number; body: unknown }): string {
    const parts: string[] = [];
    if (isRecord(body) && isRecord(body['error'])) {
        const err = body['error'];
        const code = typeof err['code'] === 'string' ? err['code'] : undefined;
        const message = typeof err['message'] === 'string' ? err['message'] : undefined;
        if (code) parts.push(code);
        if (message) parts.push(message);
        const inner = err['innerError'];
        if (isRecord(inner) && typeof inner['request-id'] === 'string') {
            parts.push(`(request-id ${inner['request-id']})`);
        }
    } else if (typeof body === 'string' && body.trim() !== '') {
        parts.push(body.trim().slice(0, 500));
    }
    const detail = parts.join(': ').replace(/: \(request-id/, ' (request-id');
    return detail === '' ? `HTTP ${status}` : detail;
}

export function getHttpErrorStatus(error: unknown): number | undefined {
    if (error instanceof GraphApiError) {
        return error.graphStatus;
    }
    if (isRecord(error) && 'response' in error && isRecord(error['response'])) {
        const status = error['response']['status'];
        return typeof status === 'number' ? status : undefined;
    }
    return undefined;
}

function getHttpErrorBody(error: unknown): unknown {
    if (isRecord(error) && 'response' in error && isRecord(error['response'])) {
        return error['response']['body'];
    }
    return undefined;
}

function toGraphApiError({ error, method, url }: { error: unknown; method: HttpMethod; url: string }): Error {
    const path = describePath(url);
    const status = getHttpErrorStatus(error);
    if (status !== undefined) {
        const detail = graphErrorDetail({ status, body: getHttpErrorBody(error) });
        const hint = status === 401
            ? ' Reconnect the Azure Active Directory connection.'
            : status === 403
                ? ' The connection or the signed-in user lacks the permission for this operation; pick a broader Permissions preset or use an account with the needed Entra role.'
                : '';
        return new GraphApiError({
            message: `Microsoft Graph ${method} ${path} failed (${status}): ${detail}.${hint}`,
            graphStatus: status,
            graphCode: graphErrorCode(getHttpErrorBody(error)),
        });
    }
    const reason = error instanceof Error ? error.message : String(error);
    const applied = method === HttpMethod.GET ? '' : ' The change may still have been applied; check before retrying.';
    return new GraphApiError({
        message: `Microsoft Graph ${method} ${path} did not complete: ${reason}.${applied}`,
        graphStatus: undefined,
        graphCode: undefined,
    });
}

function graphErrorCode(body: unknown): string | undefined {
    if (isRecord(body) && isRecord(body['error']) && typeof body['error']['code'] === 'string') {
        return body['error']['code'];
    }
    return undefined;
}

function describePath(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.pathname.replace(/^\/v1\.0/, '');
    } catch {
        return url;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
}

export function clampLimit({ value, max, fallback }: { value: unknown; max: number; fallback: number }): number {
    const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(1, Math.floor(n)));
}

export async function fetchGraphPage<T>({
    accessToken,
    url,
    query,
    headers,
    cursor,
}: {
    accessToken: string;
    url: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    cursor?: string;
}): Promise<GraphListPage<T>> {
    const trimmedCursor = typeof cursor === 'string' ? cursor.trim() : '';
    const res = trimmedCursor !== ''
        ? await callGraphApi<GraphCollection<T>>(accessToken, { method: HttpMethod.GET, url: assertGraphUrl(trimmedCursor), headers })
        : await callGraphApi<GraphCollection<T>>(accessToken, { method: HttpMethod.GET, url, query, headers });
    const nextCursor = res['@odata.nextLink'] ?? null;
    return { items: res.value ?? [], next_cursor: nextCursor, has_more: nextCursor !== null };
}

export async function fetchAllGraphPages<T>({
    accessToken,
    url,
    query,
    headers,
    maxPages,
    tooManyMessage,
}: {
    accessToken: string;
    url: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    maxPages: number;
    tooManyMessage: string;
}): Promise<T[]> {
    const all: T[] = [];
    let page = await fetchGraphPage<T>({ accessToken, url, query, headers });
    all.push(...page.items);
    let pages = 1;
    while (page.next_cursor !== null) {
        if (pages >= maxPages) {
            throw new Error(tooManyMessage);
        }
        page = await fetchGraphPage<T>({ accessToken, url, headers, cursor: page.next_cursor });
        all.push(...page.items);
        pages += 1;
    }
    return all;
}

async function fetchDropdownPages<T>({
    accessToken,
    url,
    query,
    headers,
}: {
    accessToken: string;
    url: string;
    query: Record<string, string>;
    headers?: Record<string, string>;
}): Promise<{ items: T[]; truncated: boolean }> {
    const items: T[] = [];
    let page = await fetchGraphPage<T>({ accessToken, url, query, headers });
    items.push(...page.items);
    let pages = 1;
    while (page.next_cursor !== null && pages < DROPDOWN_MAX_PAGES) {
        page = await fetchGraphPage<T>({ accessToken, url, headers, cursor: page.next_cursor });
        items.push(...page.items);
        pages += 1;
    }
    return { items, truncated: page.next_cursor !== null };
}

export async function searchUsersForDropdown({
    accessToken,
    search,
}: {
    accessToken: string;
    search?: string;
}): Promise<{ items: DropdownUser[]; truncated: boolean }> {
    const term = (search ?? '').trim();
    const query: Record<string, string> = { $top: '999', $select: 'id,displayName,userPrincipalName,mail' };
    if (term === '') {
        return fetchDropdownPages<DropdownUser>({ accessToken, url: '/users', query });
    }
    const v = escapeODataString(term);
    query['$filter'] = `startswith(displayName,'${v}') or startswith(userPrincipalName,'${v}') or startswith(mail,'${v}')`;
    query['$count'] = 'true';
    return fetchDropdownPages<DropdownUser>({ accessToken, url: '/users', query, headers: { ConsistencyLevel: 'eventual' } });
}

export async function searchGroupsForDropdown({
    accessToken,
    search,
}: {
    accessToken: string;
    search?: string;
}): Promise<{ items: DropdownGroup[]; truncated: boolean }> {
    const term = (search ?? '').trim();
    const query: Record<string, string> = { $top: '999', $select: 'id,displayName,mail' };
    if (term === '') {
        return fetchDropdownPages<DropdownGroup>({ accessToken, url: '/groups', query });
    }
    const v = escapeODataString(term);
    query['$filter'] = `startswith(displayName,'${v}') or startswith(mail,'${v}')`;
    query['$count'] = 'true';
    return fetchDropdownPages<DropdownGroup>({ accessToken, url: '/groups', query, headers: { ConsistencyLevel: 'eventual' } });
}

export async function listGroupMembersForDropdown({
    accessToken,
    groupId,
    search,
}: {
    accessToken: string;
    groupId: string;
    search?: string;
}): Promise<{ items: DropdownMember[]; truncated: boolean }> {
    const result = await fetchDropdownPages<DropdownMember>({
        accessToken,
        url: `/groups/${encodeURIComponent(groupId)}/members`,
        query: { $top: '999', $select: 'id,displayName,userPrincipalName,mail' },
    });
    const term = (search ?? '').trim().toLowerCase();
    if (term === '') return result;
    return {
        truncated: result.truncated,
        items: result.items.filter((m) =>
            [m.displayName, m.userPrincipalName, m.mail].some((f) => typeof f === 'string' && f.toLowerCase().includes(term)),
        ),
    };
}

export function userOptionLabel(u: DropdownUser): string {
    return `${u.displayName ?? u.id} (${u.userPrincipalName ?? u.mail ?? u.id})`;
}

export function groupOptionLabel(g: DropdownGroup): string {
    return `${g.displayName ?? g.id}${g.mail ? ` (${g.mail})` : ''}`;
}

export function dropdownErrorPlaceholder({ what, error }: { what: string; error: unknown }): string {
    const message = error instanceof Error ? error.message : String(error);
    return `Could not load ${what}: ${message}`;
}

function dropdownPlaceholder({ count, truncated, empty }: { count: number; truncated: boolean; empty: string }): string | undefined {
    if (count === 0) return empty;
    if (truncated) return `First ${count} shown. Type to search.`;
    return undefined;
}

export const userDropdown = Property.Dropdown({
    displayName: 'User',
    description: 'Select the user, or type to search by name, user principal name or email. You can also pass a user object ID or UPN.',
    refreshers: [],
    refreshOnSearch: true,
    required: true,
    auth: azureAdAuth,
    options: async ({ auth }, { searchValue }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
        try {
            const { items, truncated } = await searchUsersForDropdown({ accessToken: auth.access_token, search: searchValue });
            return {
                disabled: false,
                options: items.map((u) => ({ label: userOptionLabel(u), value: u.id })),
                placeholder: dropdownPlaceholder({ count: items.length, truncated, empty: 'No users found. Search name or email.' }),
            };
        } catch (error) {
            return { disabled: true, options: [], placeholder: dropdownErrorPlaceholder({ what: 'users', error }) };
        }
    },
});

export const groupDropdown = Property.Dropdown({
    displayName: 'Group',
    description: 'Select the group, or type to search by name or email. You can also pass a group object ID.',
    refreshers: [],
    refreshOnSearch: true,
    required: true,
    auth: azureAdAuth,
    options: async ({ auth }, { searchValue }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
        try {
            const { items, truncated } = await searchGroupsForDropdown({ accessToken: auth.access_token, search: searchValue });
            return {
                disabled: false,
                options: items.map((g) => ({ label: groupOptionLabel(g), value: g.id })),
                placeholder: dropdownPlaceholder({ count: items.length, truncated, empty: 'No groups found. Type to search by name.' }),
            };
        } catch (error) {
            return { disabled: true, options: [], placeholder: dropdownErrorPlaceholder({ what: 'groups', error }) };
        }
    },
});

export async function getUsersAndGroupsForDropdown({
    accessToken,
    search,
}: {
    accessToken: string;
    search?: string;
}): Promise<{ options: { label: string; value: string }[]; truncated: boolean }> {
    const [users, groups] = await Promise.all([
        searchUsersForDropdown({ accessToken, search }),
        searchGroupsForDropdown({ accessToken, search }),
    ]);
    const userOptions = users.items.map((u) => ({ label: `User: ${userOptionLabel(u)}`, value: u.id }));
    const groupOptions = groups.items.map((g) => ({ label: `Group: ${groupOptionLabel(g)}`, value: g.id }));
    return { options: [...userOptions, ...groupOptions], truncated: users.truncated || groups.truncated };
}

export const directoryObjectDropdown = Property.Dropdown({
    displayName: 'Member',
    description: 'Select the user or group to add as a member, or type to search. You can also pass a directory object ID.',
    refreshers: [],
    refreshOnSearch: true,
    required: true,
    auth: azureAdAuth,
    options: async ({ auth }, { searchValue }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
        try {
            const { options, truncated } = await getUsersAndGroupsForDropdown({ accessToken: auth.access_token, search: searchValue });
            return {
                disabled: false,
                options,
                placeholder: dropdownPlaceholder({ count: options.length, truncated, empty: 'No users or groups found.' }),
            };
        } catch (error) {
            return { disabled: true, options: [], placeholder: dropdownErrorPlaceholder({ what: 'users and groups', error }) };
        }
    },
});

export async function getResourceOptionsForType({
    accessToken,
    resourceType,
    search,
}: {
    accessToken: string;
    resourceType: string;
    search?: string;
}): Promise<{ options: { label: string; value: string }[]; truncated: boolean }> {
    if (resourceType === 'users') {
        const { items, truncated } = await searchUsersForDropdown({ accessToken, search });
        return { options: items.map((u) => ({ label: userOptionLabel(u), value: u.id })), truncated };
    }
    if (resourceType === 'groups') {
        const { items, truncated } = await searchGroupsForDropdown({ accessToken, search });
        return { options: items.map((g) => ({ label: groupOptionLabel(g), value: g.id })), truncated };
    }
    return { options: [], truncated: false };
}

export function resourcePlaceholder({ count, truncated }: { count: number; truncated: boolean }): string | undefined {
    return dropdownPlaceholder({ count, truncated, empty: 'Nothing found. Type to search.' });
}

export function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        const flatKey = prefix ? `${prefix}_${k}` : k;
        if (v === null || v === undefined) {
            out[flatKey] = null;
        } else if (Array.isArray(v)) {
            out[flatKey] = v
                .map((item) =>
                    typeof item === 'object' && item !== null && !(item instanceof Date)
                        ? JSON.stringify(item)
                        : String(item),
                )
                .join(', ');
        } else if (isRecord(v)) {
            if (v['@odata.type']) continue;
            Object.assign(out, flattenObject(v, flatKey));
        } else {
            out[flatKey] = v;
        }
    }
    return out;
}

export function flattenUser(obj: Record<string, unknown>): Record<string, unknown> {
    return withNullDefaults({ obj: flattenObject(stripODataKeys(obj)), keys: flattenedUserFields.map((f) => f.key) });
}
export function flattenGroup(obj: Record<string, unknown>): Record<string, unknown> {
    return withNullDefaults({ obj: flattenObject(stripODataKeys(obj)), keys: flattenedGroupFields.map((f) => f.key) });
}

export function stripODataKeys(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('@odata.')));
}

export function withNullDefaults({ obj, keys }: { obj: Record<string, unknown>; keys: string[] }): Record<string, unknown> {
    const defaults = Object.fromEntries(keys.map((k) => [k, null]));
    return { ...defaults, ...obj };
}

function selectKeys(select: string): string[] {
    return select.split(',').map((k) => k.trim()).filter(Boolean);
}

function normalizeTriggerObject({ item, config }: { item: DirectoryObject; config: NewObjectTriggerConfig }): DirectoryObject {
    const arrayKeys = config.arrayKeys ?? [];
    const filled = withNullDefaults({ obj: stripODataKeys(item), keys: selectKeys(config.select) });
    const arrays = Object.fromEntries(arrayKeys.map((k) => [k, Array.isArray(filled[k]) ? filled[k] : []]));
    return { ...filled, ...arrays, id: item.id };
}

export async function fetchExtensionPropertyNames({
    accessToken,
    targetObject,
}: {
    accessToken: string;
    targetObject: 'User' | 'Group';
}): Promise<string[]> {
    const res = await callGraphApi<GraphCollection<{ name?: string; targetObjects?: string[] }>>(accessToken, {
        method: HttpMethod.POST,
        url: '/directoryObjects/getAvailableExtensionProperties',
        body: { isSyncedFromOnPremises: false },
    });
    const names = (res.value ?? [])
        .filter((p) => Array.isArray(p.targetObjects) && p.targetObjects.includes(targetObject))
        .map((p) => p.name)
        .filter((n): n is string => typeof n === 'string' && n !== '');
    return Array.from(new Set(names));
}

export async function seedDeltaLink({
    accessToken,
    deltaPath,
    select,
}: {
    accessToken: string;
    deltaPath: string;
    select: string;
}): Promise<string> {
    const query = new URLSearchParams({ $deltaToken: 'latest', $select: select });
    const { deltaLink } = await readDeltaChanges<{ id: string }>({ accessToken, url: `${deltaPath}?${query.toString()}` });
    return deltaLink;
}

export async function readDeltaChanges<T>({
    accessToken,
    url,
}: {
    accessToken: string;
    url: string;
}): Promise<{ items: T[]; deltaLink: string }> {
    const items: T[] = [];
    let nextUrl = url;
    for (let page = 0; page < DELTA_MAX_PAGES; page++) {
        const res = await callGraphApi<GraphCollection<T> & { '@odata.deltaLink'?: string }>(accessToken, {
            method: HttpMethod.GET,
            url: nextUrl,
        });
        items.push(...(res.value ?? []));
        if (res['@odata.deltaLink']) {
            return { items, deltaLink: res['@odata.deltaLink'] };
        }
        if (!res['@odata.nextLink']) {
            throw new Error('Microsoft Graph delta response had neither a next link nor a delta link; the trigger state was not advanced.');
        }
        nextUrl = res['@odata.nextLink'];
    }
    throw new Error(`Microsoft Graph returned more than ${DELTA_MAX_PAGES} pages of directory changes in one poll; the trigger state was not advanced. Disable and re-enable the trigger to start from now.`);
}

export async function enableNewObjectTrigger({
    accessToken,
    store,
    config,
    isRepublish,
}: {
    accessToken: string;
    store: Store;
    config: NewObjectTriggerConfig;
    isRepublish: boolean;
}): Promise<void> {
    if (isRepublish && (await store.get<NewObjectTriggerState>(config.stateKey)) !== null) {
        return;
    }
    const deltaLink = await seedDeltaLink({ accessToken, deltaPath: config.deltaPath, select: config.select });
    const now = Date.now();
    await store.put<NewObjectTriggerState>(config.stateKey, { deltaLink, enabledAtMs: now, lastPollMs: now, seen: [] });
}

export async function disableNewObjectTrigger({ store, config }: { store: Store; config: NewObjectTriggerConfig }): Promise<void> {
    await store.delete(config.stateKey);
    await store.delete(config.legacyDeltaKey);
    await store.delete('lastPoll');
}

export async function pollNewObjects({
    accessToken,
    store,
    config,
}: {
    accessToken: string;
    store: Store;
    config: NewObjectTriggerConfig;
}): Promise<DirectoryObject[]> {
    const startedAt = Date.now();
    const state = await loadNewObjectState({ store, config });
    if (state === null) {
        const deltaLink = await seedDeltaLink({ accessToken, deltaPath: config.deltaPath, select: config.select });
        await store.put<NewObjectTriggerState>(config.stateKey, { deltaLink, enabledAtMs: startedAt, lastPollMs: startedAt, seen: [] });
        return [];
    }
    const { items, deltaLink } = await readDeltaChanges<DirectoryObject>({ accessToken, url: state.deltaLink });
    const live = uniqueById(items.filter((item) => item['@removed'] === undefined && typeof item.id === 'string'));
    const withCreated = await fillCreatedDateTime({ accessToken, config, items: live });
    const floor = Math.max(state.enabledAtMs, state.lastPollMs - NEW_OBJECT_LAG_MS);
    const seenIds = new Set(state.seen.map((s) => s.id));
    const emitted = withCreated.filter((item) => {
        const created = parseCreated(item);
        return created !== undefined && created >= floor && !seenIds.has(item.id);
    });
    const nextFloor = Math.max(state.enabledAtMs, startedAt - NEW_OBJECT_LAG_MS);
    const seen = [
        ...state.seen,
        ...emitted.map((item) => ({ id: item.id, createdMs: parseCreated(item) ?? startedAt })),
    ]
        .filter((s) => s.createdMs >= nextFloor)
        .slice(-NEW_OBJECT_SEEN_CAP);
    await store.put<NewObjectTriggerState>(config.stateKey, {
        deltaLink,
        enabledAtMs: state.enabledAtMs,
        lastPollMs: startedAt,
        seen,
    });
    return emitted.map((item) => normalizeTriggerObject({ item, config }));
}

export async function listRecentObjects({
    accessToken,
    config,
}: {
    accessToken: string;
    config: NewObjectTriggerConfig;
}): Promise<DirectoryObject[]> {
    const res = await callGraphApi<GraphCollection<DirectoryObject>>(accessToken, {
        method: HttpMethod.GET,
        url: config.objectPath,
        query: { $select: config.select, $orderby: 'createdDateTime desc', $top: '5', $count: 'true' },
        headers: { ConsistencyLevel: 'eventual' },
    });
    return (res.value ?? []).map((item) => normalizeTriggerObject({ item, config }));
}

async function loadNewObjectState({ store, config }: { store: Store; config: NewObjectTriggerConfig }): Promise<NewObjectTriggerState | null> {
    const state = await store.get<NewObjectTriggerState>(config.stateKey);
    if (state !== null) return state;
    const legacyLink = await store.get<string>(config.legacyDeltaKey);
    if (typeof legacyLink !== 'string' || legacyLink === '') return null;
    const legacyLastPoll = await store.get<number>('lastPoll');
    const lastPollMs = typeof legacyLastPoll === 'number' ? legacyLastPoll + 1 + NEW_OBJECT_LAG_MS : Date.now();
    return { deltaLink: legacyLink, enabledAtMs: lastPollMs - NEW_OBJECT_LAG_MS, lastPollMs, seen: [] };
}

async function fillCreatedDateTime({
    accessToken,
    config,
    items,
}: {
    accessToken: string;
    config: NewObjectTriggerConfig;
    items: DirectoryObject[];
}): Promise<DirectoryObject[]> {
    const missing = items.filter((item) => parseCreated(item) === undefined);
    if (missing.length > NEW_OBJECT_LOOKUP_CAP) {
        throw new Error(`${missing.length} changed directory objects came without a creation time, more than the ${NEW_OBJECT_LOOKUP_CAP} this trigger looks up per poll; the trigger state was not advanced. Disable and re-enable the trigger to start from now.`);
    }
    const filled = new Map<string, DirectoryObject | null>();
    for (const item of missing) {
        try {
            const full = await callGraphApi<DirectoryObject>(accessToken, {
                method: HttpMethod.GET,
                url: `${config.objectPath}/${encodeURIComponent(item.id)}`,
                query: { $select: config.select },
            });
            filled.set(item.id, full);
        } catch (error) {
            if (getHttpErrorStatus(error) !== 404) throw error;
            filled.set(item.id, null);
        }
    }
    return items.flatMap((item) => {
        if (!filled.has(item.id)) return [item];
        const full = filled.get(item.id);
        return full ? [{ ...item, ...full }] : [];
    });
}

function parseCreated(item: DirectoryObject): number | undefined {
    const raw = item['createdDateTime'];
    if (typeof raw !== 'string') return undefined;
    const ms = Date.parse(raw);
    return Number.isNaN(ms) ? undefined : ms;
}

function uniqueById(items: DirectoryObject[]): DirectoryObject[] {
    const byId = new Map<string, DirectoryObject>();
    for (const item of items) {
        byId.set(item.id, { ...byId.get(item.id), ...item });
    }
    return Array.from(byId.values());
}

export class GraphApiError extends Error {
    readonly graphStatus: number | undefined;
    readonly graphCode: string | undefined;
    constructor({ message, graphStatus, graphCode }: { message: string; graphStatus: number | undefined; graphCode: string | undefined }) {
        super(message);
        this.name = 'GraphApiError';
        this.graphStatus = graphStatus;
        this.graphCode = graphCode;
    }
}

export const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
export const GRAPH_ORIGIN = 'https://graph.microsoft.com';
export const GRAPH_TIMEOUT_MS = 60000;
export const DROPDOWN_MAX_PAGES = 5;
export const DELTA_MAX_PAGES = 200;
export const NEW_OBJECT_LAG_MS = 24 * 60 * 60 * 1000;
export const NEW_OBJECT_SEEN_CAP = 5000;
export const NEW_OBJECT_LOOKUP_CAP = 100;

export const flattenedUserFields: OutputSchema['fields'] = [
    { key: 'id', label: 'User ID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
    { key: 'mail', label: 'Mail', format: 'email' },
    { key: 'givenName', label: 'Given Name' },
    { key: 'surname', label: 'Surname' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'mobilePhone', label: 'Mobile Phone' },
    { key: 'businessPhones', label: 'Business Phones', description: 'Comma-separated list.' },
    { key: 'officeLocation', label: 'Office Location' },
    { key: 'preferredLanguage', label: 'Preferred Language' },
];

export const flattenedGroupFields: OutputSchema['fields'] = [
    { key: 'id', label: 'Group ID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Description' },
    { key: 'mail', label: 'Mail', format: 'email' },
    { key: 'mailNickname', label: 'Mail Nickname' },
    { key: 'mailEnabled', label: 'Mail Enabled', format: 'boolean' },
    { key: 'securityEnabled', label: 'Security Enabled', format: 'boolean' },
    { key: 'groupTypes', label: 'Group Types', description: 'Comma-separated list, e.g. "Unified" for Microsoft 365 groups.' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
    { key: 'renewedDateTime', label: 'Renewed At', format: 'datetime' },
    { key: 'securityIdentifier', label: 'Security Identifier' },
    { key: 'proxyAddresses', label: 'Proxy Addresses', description: 'Comma-separated list.' },
    { key: 'isAssignableToRole', label: 'Assignable to Role', format: 'boolean' },
];

export const userItemFields: OutputSchema['fields'] = [
    { key: 'id', label: 'User ID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
    { key: 'mail', label: 'Mail', format: 'email' },
    { key: 'givenName', label: 'Given Name' },
    { key: 'surname', label: 'Surname' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'accountEnabled', label: 'Account Enabled', format: 'boolean' },
    { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
];

export const groupItemFields: OutputSchema['fields'] = [
    { key: 'id', label: 'Group ID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Description' },
    { key: 'mail', label: 'Mail', format: 'email' },
    { key: 'mailNickname', label: 'Mail Nickname' },
    { key: 'mailEnabled', label: 'Mail Enabled', format: 'boolean' },
    { key: 'securityEnabled', label: 'Security Enabled', format: 'boolean' },
    { key: 'groupTypes', label: 'Group Types' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
];

export const pagingFields: OutputSchema['fields'] = [
    { key: 'next_cursor', label: 'Next Cursor', description: 'Pass as Cursor to get the next page; null when there are no more results.' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
];

export const USER_ITEM_SELECT = 'id,displayName,userPrincipalName,mail,givenName,surname,jobTitle,department,accountEnabled,createdDateTime';
export const GROUP_ITEM_SELECT = 'id,displayName,description,mail,mailNickname,mailEnabled,securityEnabled,groupTypes,visibility,createdDateTime';

export type GraphCollection<T> = {
    value?: T[];
    '@odata.nextLink'?: string;
};

export type GraphListPage<T> = {
    items: T[];
    next_cursor: string | null;
    has_more: boolean;
};

export type DropdownUser = { id: string; displayName?: string; userPrincipalName?: string; mail?: string };
export type DropdownGroup = { id: string; displayName?: string; mail?: string };
export type DropdownMember = { id: string; displayName?: string; userPrincipalName?: string; mail?: string };

export type DirectoryObject = {
    id: string;
    createdDateTime?: string;
    '@removed'?: { reason?: string };
    [key: string]: unknown;
};

export type NewObjectTriggerConfig = {
    stateKey: string;
    legacyDeltaKey: string;
    deltaPath: string;
    objectPath: string;
    select: string;
    arrayKeys?: string[];
};

export type NewObjectTriggerState = {
    deltaLink: string;
    enabledAtMs: number;
    lastPollMs: number;
    seen: { id: string; createdMs: number }[];
};
