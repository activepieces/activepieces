import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { azureAdAuth } from './auth';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

type OAuth2Auth = { access_token: string };

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
            const token = (auth as OAuth2Auth).access_token;
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
            const token = (auth as OAuth2Auth).access_token;
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
            const token = (auth as OAuth2Auth).access_token;
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

/** Flattens a Graph webhook notification item for table-ready trigger output. */
export function flattenNotificationItem(item: {
    clientState?: string;
    changeType?: string;
    resource?: string;
    resourceData?: unknown;
}): Record<string, unknown> {
    const data =
        typeof item.resourceData === 'object' && item.resourceData !== null
            ? flattenObject(item.resourceData as Record<string, unknown>)
            : {};
    return {
        change_type: item.changeType ?? null,
        resource: item.resource ?? null,
        client_state: item.clientState ?? null,
        ...data,
    };
}

const SUBSCRIPTION_MAX_MINUTES = 2880; // 2 days (Graph allows up to 4230 for some resources)

export async function createGraphSubscription(
    accessToken: string,
    params: { resource: string; changeType: string; notificationUrl: string; clientState: string },
): Promise<string> {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + SUBSCRIPTION_MAX_MINUTES);
    const body = {
        changeType: params.changeType,
        notificationUrl: params.notificationUrl,
        resource: params.resource,
        expirationDateTime: expiration.toISOString(),
        clientState: params.clientState,
    };
    const sub = await callGraphApi<{ id: string }>(accessToken, {
        method: HttpMethod.POST,
        url: `${GRAPH_BASE}/subscriptions`,
        body,
    });
    return sub.id;
}

export async function deleteGraphSubscription(accessToken: string, subscriptionId: string): Promise<void> {
    await callGraphApi(accessToken, {
        method: HttpMethod.DELETE,
        url: `${GRAPH_BASE}/subscriptions/${subscriptionId}`,
    });
}
