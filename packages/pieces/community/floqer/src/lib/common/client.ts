import {
    httpClient,
    HttpError,
    HttpMethod,
    QueryParams,
} from '@activepieces/pieces-common';

async function request<T>({
    apiKey,
    method,
    path,
    body,
    queryParams,
}: FloqerRequest): Promise<T> {
    const response = await httpClient.sendRequest<T>({
        method,
        url: `${FLOQER_BASE_URL}${path}`,
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        queryParams,
        body,
    });
    return response.body;
}

async function enveloped<T>(params: FloqerRequest): Promise<FloqerEnvelope<T>> {
    return request<FloqerEnvelope<T>>(params);
}

async function bare<T>(params: FloqerRequest): Promise<T> {
    return request<T>(params);
}

function statusOf(error: unknown): number | undefined {
    if (error instanceof HttpError) {
        return error.response.status;
    }
    return undefined;
}

function codeOf(error: unknown): string | undefined {
    return readErrorField(error, 'code');
}

function messageOf(error: unknown): string | undefined {
    return readErrorField(error, 'message');
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function describe(error: unknown, fallback: string): string {
    const message = messageOf(error);
    const code = codeOf(error);
    if (message !== undefined && code !== undefined) {
        return `${message} (${code})`;
    }
    return message ?? code ?? fallback;
}

function readErrorField(error: unknown, field: 'code' | 'message'): string | undefined {
    if (!(error instanceof HttpError)) {
        return undefined;
    }
    const body = error.response.body;
    if (!isRecord(body)) {
        return undefined;
    }
    const nested = isRecord(body['error']) ? body['error'] : undefined;
    return asString(nested?.[field]) ?? asString(body[field]);
}

export const floqerApi = {
    enveloped,
    bare,
    statusOf,
    codeOf,
    messageOf,
    describe,
};

export const FLOQER_BASE_URL = 'https://api.floqer.com';

export type FloqerRequest = {
    apiKey: string;
    method: HttpMethod;
    path: string;
    body?: unknown;
    queryParams?: QueryParams;
};

export type FloqerWarning = {
    field: string;
    code: string;
    message: string;
};

export type FloqerEnvelope<T> = {
    status: number;
    message?: string;
    data: T;
    warnings?: FloqerWarning[];
};
