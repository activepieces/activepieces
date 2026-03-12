import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

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

export function flattenObject(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
            const nested = v as Record<string, unknown>;
            if (nested['@odata.type']) continue;
            for (const [k2, v2] of Object.entries(nested)) {
                out[`${k}_${k2}`] = v2;
            }
        } else {
            out[k] = v;
        }
    }
    return out;
}

/** @deprecated use flattenObject */
export const flattenUser = flattenObject;
/** @deprecated use flattenObject */
export const flattenGroup = flattenObject;

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
