import {
    httpClient,
    HttpMethod,
    HttpMessageBody,
    QueryParams,
} from '@activepieces/pieces-common';

const EXT_SUFFIX = '/api/v1/ext';

function normalizeBaseUrl({ baseUrl }: { baseUrl: string }): string {
    const trimmed = baseUrl.trim().replace(/\/+$/, '');
    if (trimmed.endsWith(EXT_SUFFIX)) {
        return trimmed;
    }
    return `${trimmed}${EXT_SUFFIX}`;
}

function authHeaders({ apiKey }: { apiKey: string }): Record<string, string> {
    return {
        Authorization: `Bearer ${apiKey}`,
    };
}

async function request<T extends HttpMessageBody>({
    baseUrl,
    apiKey,
    method,
    path,
    query,
    body,
}: {
    baseUrl: string;
    apiKey: string;
    method: HttpMethod;
    path: string;
    query?: Record<string, string | number | undefined>;
    body?: unknown;
}): Promise<T> {
    const qs: QueryParams = {};
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                qs[key] = String(value);
            }
        }
    }
    const response = await httpClient.sendRequest<T>({
        method,
        url: `${normalizeBaseUrl({ baseUrl })}${path}`,
        headers: authHeaders({ apiKey }),
        queryParams: qs,
        body,
    });
    return response.body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function flattenShallow(record: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
        if (isRecord(value)) {
            for (const [innerKey, innerValue] of Object.entries(value)) {
                if (!isRecord(innerValue) && !Array.isArray(innerValue)) {
                    result[`${key}_${innerKey}`] = innerValue;
                }
            }
        } else {
            result[key] = value;
        }
    }
    return result;
}

function unwrapData(body: unknown): unknown {
    if (!isRecord(body)) {
        return body;
    }
    if ('data' in body) {
        return body['data'];
    }
    return body;
}

function extractList({
    body,
    collectionKeys,
}: {
    body: unknown;
    collectionKeys: string[];
}): Record<string, unknown>[] {
    const unwrapped = unwrapData(body);
    if (Array.isArray(unwrapped)) {
        return unwrapped.filter(isRecord).map((item) => flattenShallow(item));
    }
    if (!isRecord(unwrapped)) {
        return [];
    }
    if (Array.isArray(unwrapped['results'])) {
        return unwrapped['results'].filter(isRecord).map((item) => flattenShallow(item));
    }
    for (const key of collectionKeys) {
        const value = unwrapped[key];
        if (Array.isArray(value)) {
            return value.filter(isRecord).map((item) => flattenShallow(item));
        }
    }
    return [flattenShallow(unwrapped)];
}

function readProp({
    props,
    key,
}: {
    props: Record<string, unknown>;
    key: string;
}): string {
    const value = props[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`HK Voice connection is missing ${key}`);
    }
    return value;
}

function connectionFromAuth(auth: unknown): VoiceConnection {
    if (!isRecord(auth)) {
        throw new Error('HK Voice connection is missing');
    }
    const props = isRecord(auth['props']) ? auth['props'] : auth;
    return {
        baseUrl: readProp({ props, key: 'base_url' }),
        apiKey: readProp({ props, key: 'api_key' }),
    };
}

function flattenBody(body: unknown): Record<string, unknown> {
    const unwrapped = unwrapData(body);
    if (isRecord(unwrapped)) {
        return flattenShallow(unwrapped);
    }
    if (isRecord(body)) {
        return flattenShallow(body);
    }
    return { result: body };
}

function optionLabel(record: Record<string, unknown>): string {
    const name =
        record['name'] ??
        record['friendly_name'] ??
        record['display_name'] ??
        record['label'] ??
        record['phone_number'];
    const id = record['id'] ?? record['phone_number'] ?? record['number'];
    if (typeof name === 'string' && typeof id === 'string' && name !== id) {
        return `${name} (${id})`;
    }
    if (typeof name === 'string') {
        return name;
    }
    if (typeof id === 'string') {
        return id;
    }
    return 'Untitled';
}

function optionValue(record: Record<string, unknown>): string | undefined {
    const id = record['id'] ?? record['phone_number'] ?? record['number'];
    return typeof id === 'string' ? id : undefined;
}

function phoneNumberValue(record: Record<string, unknown>): string | undefined {
    const phone = record['phone_number'] ?? record['number'] ?? record['e164'];
    if (typeof phone === 'string') {
        return phone;
    }
    return optionValue(record);
}

export const hkVoiceApi = {
    paths: {
        discovery: '/',
        agents: '/agents/',
        agentClone: '/agents/clone/',
        agentById: (id: string) => `/agents/${id}/`,
        callFlows: '/callflows/',
        callFlowById: (id: string) => `/callflows/${id}/`,
        campaigns: '/campaigns/',
        campaignById: (id: string) => `/campaigns/${id}/`,
        campaignStart: (id: string) => `/campaigns/${id}/start/`,
        dispatch: '/calls/dispatch/',
        phoneNumbers: '/phone_numbers/',
        marketplace: '/marketplace/',
        contacts: '/contacts/',
        contactById: (id: string) => `/contacts/${id}/`,
        contactSearch: '/contacts/search/',
        callLogs: '/call_logs/',
        callLogById: (id: string) => `/call_logs/${id}/`,
        callLogMedia: (id: string) => `/call_logs/${id}/media/`,
        wallet: '/wallet/',
        walletDeduct: '/wallet/deduct/',
    },
    normalizeBaseUrl,
    authHeaders,
    request,
    extractList,
    flattenShallow,
    unwrapData,
    connectionFromAuth,
    flattenBody,
    optionLabel,
    optionValue,
    phoneNumberValue,
};

type VoiceConnection = {
    baseUrl: string;
    apiKey: string;
};
