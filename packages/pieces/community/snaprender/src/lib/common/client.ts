import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

export const snaprenderApi = {
    request,
    toBuffer,
    headerValue,
};

async function request<T = unknown>({
    apiKey,
    method,
    path,
    body,
    query,
    responseType = 'json',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    slowPageHint = false,
}: {
    apiKey: string;
    method: HttpMethod;
    path: string;
    body?: unknown;
    query?: Record<string, QueryValue>;
    responseType?: 'json' | 'arraybuffer';
    timeoutMs?: number;
    slowPageHint?: boolean;
}): Promise<SnapRenderResponse<T>> {
    if (!path.startsWith('/') || path.startsWith('//')) {
        throw new Error(`Invalid SnapRender path "${path}".`);
    }
    const key = apiKey.trim();
    if (key === '') {
        throw new Error('The SnapRender API key is empty. Reconnect with the key from https://app.snap-render.com/dashboard/keys');
    }
    try {
        const response = await httpClient.sendRequest<T>({
            method,
            url: `${SNAPRENDER_BASE_URL}${path}`,
            headers: {
                'X-API-Key': key,
                'User-Agent': USER_AGENT,
                Accept: responseType === 'json' ? 'application/json' : '*/*',
                ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            },
            queryParams: cleanQuery(query),
            body,
            responseType,
            timeout: timeoutMs,
            redactBodyInErrors: true,
        });
        return {
            status: response.status,
            body: response.body,
            headers: response.headers ?? {},
        };
    } catch (error) {
        throw toError({ error, timeoutMs, slowPageHint });
    }
}

function toError({ error, timeoutMs, slowPageHint }: { error: unknown; timeoutMs: number; slowPageHint: boolean }): Error {
    if (error instanceof SnapRenderApiError) {
        return error;
    }
    const response = httpErrorResponse(error);
    if (response !== null) {
        const apiError = findApiError(response.body);
        if (apiError !== null) {
            return new SnapRenderApiError({ code: apiError.code, message: apiError.message, status: response.status });
        }
        const excerpt = bodyExcerpt(response.body);
        return new SnapRenderApiError({
            code: `HTTP_${response.status}`,
            message: `SnapRender answered with status ${response.status}${excerpt ? ` (${excerpt})` : ''}. Try again in a minute.`,
            status: response.status,
        });
    }
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : '';
    if (name === 'AbortError' || name === 'TimeoutError' || /aborted/i.test(message)) {
        const seconds = Math.round(timeoutMs / 1000);
        const hint = slowPageHint ? ' Slow pages render faster with a shorter Delay or without Full Page.' : ' Try again in a minute.';
        return new SnapRenderApiError({
            code: 'CLIENT_TIMEOUT',
            message: `SnapRender did not answer within ${seconds} seconds.${hint}`,
            status: null,
        });
    }
    return new SnapRenderApiError({ code: 'NETWORK_ERROR', message: `Could not reach SnapRender: ${message}`, status: null });
}

function toBuffer(body: unknown): Buffer {
    if (Buffer.isBuffer(body)) {
        return body;
    }
    if (body instanceof ArrayBuffer) {
        return Buffer.from(body);
    }
    if (ArrayBuffer.isView(body)) {
        return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    }
    throw new SnapRenderApiError({ code: 'UNEXPECTED_RESPONSE', message: 'SnapRender did not return a file.', status: null });
}

function headerValue({ headers, name }: { headers: ResponseHeaders; name: string }): string | null {
    const value = headers[name.toLowerCase()] ?? headers[name];
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}

function findApiError(body: unknown): { code: string; message: string } | null {
    const parsed = typeof body === 'string' ? parseJson(body) : Buffer.isBuffer(body) ? parseJson(body.toString('utf8')) : body;
    if (typeof parsed !== 'object' || parsed === null || !('error' in parsed)) {
        return null;
    }
    const inner = parsed.error;
    if (typeof inner !== 'object' || inner === null || !('code' in inner) || !('message' in inner)) {
        return null;
    }
    if (typeof inner.code !== 'string' || typeof inner.message !== 'string') {
        return null;
    }
    return { code: inner.code, message: inner.message };
}

function parseJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function httpErrorResponse(error: unknown): { status: number; body: unknown } | null {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
        return null;
    }
    const response = error.response;
    if (typeof response !== 'object' || response === null || !('status' in response)) {
        return null;
    }
    const status = response.status;
    if (typeof status !== 'number') {
        return null;
    }
    return { status, body: 'body' in response ? response.body : null };
}

function bodyExcerpt(body: unknown): string | null {
    if (body === null || body === undefined) {
        return null;
    }
    const text = typeof body === 'string' ? body : Buffer.isBuffer(body) ? body.toString('utf8') : JSON.stringify(body);
    const trimmed = text.replace(/\s+/g, ' ').trim();
    return trimmed === '' ? null : trimmed.slice(0, 200);
}

function cleanQuery(query: Record<string, QueryValue> | undefined): QueryParams {
    return Object.fromEntries(
        Object.entries(query ?? {})
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => [key, String(value)]),
    );
}

const DEFAULT_TIMEOUT_MS = 180_000;
const USER_AGENT = 'activepieces-piece-snaprender';

export const SNAPRENDER_BASE_URL = 'https://app.snap-render.com';

export class SnapRenderApiError extends Error {
    readonly code: string;
    readonly status: number | null;

    constructor({ code, message, status }: { code: string; message: string; status: number | null }) {
        super(`${code}: ${message}`);
        this.name = 'SnapRenderApiError';
        this.code = code;
        this.status = status;
    }
}

export type QueryValue = string | number | boolean | undefined | null;

export type ResponseHeaders = Record<string, string | string[] | undefined>;

export type SnapRenderResponse<T> = {
    status: number;
    body: T;
    headers: ResponseHeaders;
};
