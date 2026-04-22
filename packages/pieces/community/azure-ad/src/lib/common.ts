import { Property, Store } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { azureAdAuth } from './auth';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export async function callGraphApi<T>(
    accessToken: string,
    request: { method: HttpMethod; url: string; body?: object; query?: Record<string, string> },
): Promise<T> {
    let url = request.url.startsWith('http') ? request.url : `${GRAPH_BASE}${request.url}`;
    if (request.query && Object.keys(request.query).length > 0) {
        const search = new URLSearchParams(request.query).toString();
        url += (url.includes('?') ? '&' : '?') + search;
    }
    const req: HttpRequest = {
        method: request.method,
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    };
    if (request.body !== undefined) {
        req.body = request.body;
    }
    const res = await httpClient.sendRequest(req);
    if (res.body && typeof res.body === 'object' && 'value' in res.body) {
        return res.body as T;
    }
    return res.body as T;
}

/**
 * Flattens nested objects and converts arrays to comma-separated strings (table-ready output).
 */
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
        } else if (typeof v === 'object' && !(v instanceof Date)) {
            const nested = v as Record<string, unknown>;
            if (nested['@odata.type']) continue;
            Object.assign(out, flattenObject(nested, flatKey));
        } else {
            out[flatKey] = v;
        }
    }
    return out;
}

async function fetchUsersForDropdown(accessToken: string): Promise<{ id: string; displayName?: string; userPrincipalName?: string; mail?: string }[]> {
    const res = await callGraphApi<{ value?: Array<{ id: string; displayName?: string; userPrincipalName?: string; mail?: string }> }>(
        accessToken,
        { method: HttpMethod.GET, url: '/users', query: { $top: '999', $select: 'id,displayName,userPrincipalName,mail' } },
    );
    return res.value ?? [];
}

async function fetchGroupsForDropdown(accessToken: string): Promise<{ id: string; displayName?: string; mail?: string }[]> {
    const res = await callGraphApi<{ value?: Array<{ id: string; displayName?: string; mail?: string }> }>(
        accessToken,
        { method: HttpMethod.GET, url: '/groups', query: { $top: '999', $select: 'id,displayName,mail' } },
    );
    return res.value ?? [];
}

export const userDropdown = Property.Dropdown({
    displayName: 'User',
    description: 'Select the user. Users are loaded from your Microsoft Entra ID directory.',
    refreshers: [],
    required: true,
    auth: azureAdAuth,
    options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
        try {
            const token = auth.access_token;
            const list = await fetchUsersForDropdown(token);
            return {
                disabled: false,
                options: list.map((u) => ({
                    label: `${u.displayName ?? u.id} (${u.userPrincipalName ?? u.mail ?? u.id})`,
                    value: u.id,
                })),
                placeholder: list.length === 0 ? 'No users found.' : undefined,
            };
        } catch {
            return { disabled: true, options: [], placeholder: 'Failed to load users. Check your connection.' };
        }
    },
});

export const groupDropdown = Property.Dropdown({
    displayName: 'Group',
    description: 'Select the group. Groups are loaded from your Microsoft Entra ID directory.',
    refreshers: [],
    required: true,
    auth: azureAdAuth,
    options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
        try {
            const token = auth.access_token;
            const list = await fetchGroupsForDropdown(token);
            return {
                disabled: false,
                options: list.map((g) => ({
                    label: `${g.displayName ?? g.id}${g.mail ? ` (${g.mail})` : ''}`,
                    value: g.id,
                })),
                placeholder: list.length === 0 ? 'No groups found.' : undefined,
            };
        } catch {
            return { disabled: true, options: [], placeholder: 'Failed to load groups. Check your connection.' };
        }
    },
});

/** User and group options for "member" or "resource" dropdowns. */
export async function getUsersAndGroupsForDropdown(accessToken: string): Promise<{ label: string; value: string }[]> {
    const [users, groups] = await Promise.all([fetchUsersForDropdown(accessToken), fetchGroupsForDropdown(accessToken)]);
    const userOptions = users.map((u) => ({
        label: `User: ${u.displayName ?? u.id} (${u.userPrincipalName ?? u.mail ?? u.id})`,
        value: u.id,
    }));
    const groupOptions = groups.map((g) => ({
        label: `Group: ${g.displayName ?? g.id}${g.mail ? ` (${g.mail})` : ''}`,
        value: g.id,
    }));
    return [...userOptions, ...groupOptions];
}

export const directoryObjectDropdown = Property.Dropdown({
    displayName: 'Member',
    description: 'Select the user or group to add as a member.',
    refreshers: [],
    required: true,
    auth: azureAdAuth,
    options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account first.' };
        try {
            const token = auth.access_token;
            const options = await getUsersAndGroupsForDropdown(token);
            return {
                disabled: false,
                options,
                placeholder: options.length === 0 ? 'No users or groups found.' : undefined,
            };
        } catch {
            return { disabled: true, options: [], placeholder: 'Failed to load users and groups. Check your connection.' };
        }
    },
});

/** Options for resource dropdown when resource type is users or groups (reset-custom-attributes). */
export async function getResourceOptionsForType(
    accessToken: string,
    resourceType: string,
): Promise<{ label: string; value: string }[]> {
    if (resourceType === 'users') {
        const list = await fetchUsersForDropdown(accessToken);
        return list.map((u) => ({
            label: `${u.displayName ?? u.id} (${u.userPrincipalName ?? u.mail ?? u.id})`,
            value: u.id,
        }));
    }
    if (resourceType === 'groups') {
        const list = await fetchGroupsForDropdown(accessToken);
        return list.map((g) => ({
            label: `${g.displayName ?? g.id}${g.mail ? ` (${g.mail})` : ''}`,
            value: g.id,
        }));
    }
    return [];
}

export function flattenUser(obj: Record<string, unknown>): Record<string, unknown> {
    return flattenObject(obj);
}
export function flattenGroup(obj: Record<string, unknown>): Record<string, unknown> {
    return flattenObject(obj);
}

/**
 * Fetches incremental changes from a Microsoft Graph delta endpoint.
 *
 * Microsoft Graph change notifications (webhooks) cannot be used here because Graph
 * requires the notification URL to respond 200 OK to a synchronous validation request
 * during `POST /subscriptions`. In Activepieces, `onEnable` runs *before* the flow's
 * status is saved as ENABLED, so the webhook endpoint returns 404 for the validation
 * probe and subscription creation fails. Delta queries avoid this entirely.
 *
 * On the first call (no stored deltaLink) this seeds using `$deltaToken=latest`, which
 * skips the initial full enumeration and returns a deltaLink representing "right now",
 * so future polls only surface changes after the trigger was enabled.
 *
 * Docs: https://learn.microsoft.com/en-us/graph/delta-query-overview
 */
export async function fetchGraphDeltaChanges<T extends { '@removed'?: unknown }>(params: {
    accessToken: string;
    store: Store;
    storeKey: string;
    deltaPath: string;
    select?: string;
}): Promise<T[]> {
    const storedDeltaLink = await params.store.get<string>(params.storeKey);
    const hasStoredLink = Boolean(storedDeltaLink);

    let nextUrl: string | null;
    if (hasStoredLink) {
        nextUrl = storedDeltaLink;
    } else {
        const query = new URLSearchParams({ $deltaToken: 'latest' });
        if (params.select) query.set('$select', params.select);
        nextUrl = `${params.deltaPath}?${query.toString()}`;
    }

    const collected: T[] = [];
    while (nextUrl) {
        const res = await callGraphApi<{
            value?: T[];
            '@odata.nextLink'?: string;
            '@odata.deltaLink'?: string;
        }>(params.accessToken, { method: HttpMethod.GET, url: nextUrl });

        if (hasStoredLink && res.value) {
            for (const item of res.value) {
                if (!item['@removed']) {
                    collected.push(item);
                }
            }
        }

        if (res['@odata.deltaLink']) {
            await params.store.put(params.storeKey, res['@odata.deltaLink']);
            break;
        }
        nextUrl = res['@odata.nextLink'] ?? null;
    }
    return collected;
}
