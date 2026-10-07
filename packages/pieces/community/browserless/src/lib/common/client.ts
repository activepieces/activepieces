import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

export const browserlessApi = {
    request,
    resolveBaseUrl,
    normalizeCustomBaseUrl,
    isSameTarget,
    clampTimeout,
    toError,
    toBuffer,
    headerValue,
    siteResponse,
};

async function request<T = unknown>({
    auth,
    method,
    path,
    body,
    query,
    responseType = 'json',
    timeoutMs,
    operation,
}: {
    auth: BrowserlessAuth;
    method: HttpMethod;
    path: string;
    body?: unknown;
    query?: Record<string, QueryValue>;
    responseType?: 'json' | 'arraybuffer' | 'text';
    timeoutMs?: number;
    operation: string;
}): Promise<BrowserlessResponse<T>> {
    if (!path.startsWith('/') || path.startsWith('//')) {
        throw new Error(`Invalid Browserless path "${path}".`);
    }
    const token = (auth.apiToken ?? '').trim();
    if (token === '') {
        throw new Error('The Browserless API token is empty. Reconnect with a valid token.');
    }
    const baseUrl = resolveBaseUrl(auth);
    try {
        const response = await httpClient.sendRequest<T>({
            method,
            url: `${baseUrl}${path}`,
            headers: {
                ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
                Accept: responseType === 'json' ? 'application/json' : '*/*',
            },
            queryParams: { ...cleanQuery(query), token },
            body,
            responseType,
            timeout: clampTimeout(timeoutMs),
            followRedirects: false,
        });
        return {
            status: response.status,
            body: response.body,
            headers: response.headers ?? {},
        };
    } catch (error) {
        throw toError({ error, operation });
    }
}

function resolveBaseUrl(auth: BrowserlessAuth): string {
    if (auth.region !== 'custom') {
        if (!BROWSERLESS_REGIONS.includes(auth.region)) {
            throw new Error('Unknown Browserless region. Reconnect and pick a region from the list.');
        }
        return auth.region;
    }
    const raw = (auth.customBaseUrl ?? '').trim();
    if (raw === '') {
        throw new Error('Custom Base URL is required when the region is "Custom Endpoint".');
    }
    return normalizeCustomBaseUrl(raw);
}

function normalizeCustomBaseUrl(raw: string): string {
    const parsed = parseUrl(raw.trim());
    if (parsed === null) {
        throw new Error(`Custom Base URL "${raw}" is not a valid URL. Use a full address such as https://chrome.browserless.io`);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Custom Base URL must start with https:// or http://');
    }
    if (parsed.username !== '' || parsed.password !== '') {
        throw new Error('Custom Base URL must not contain a username or password.');
    }
    if (parsed.search !== '' || parsed.hash !== '') {
        throw new Error('Custom Base URL must not contain a query string or fragment. The API token is added for you.');
    }
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${path}`;
}

function isSameTarget({ baseUrl, url }: { baseUrl: string; url: string }): boolean {
    const target = parseUrl(url);
    const base = parseUrl(baseUrl);
    if (target === null || base === null) {
        return false;
    }
    if (target.origin !== base.origin || target.username !== '' || target.password !== '') {
        return false;
    }
    if (target.pathname.split('/').includes('..') || /%2e%2e/i.test(url)) {
        return false;
    }
    const basePath = base.pathname.replace(/\/+$/, '');
    if (basePath === '') {
        return true;
    }
    return target.pathname === basePath || target.pathname.startsWith(`${basePath}/`);
}

function clampTimeout(value: number | undefined | null): number {
    if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
        return DEFAULT_TIMEOUT_MS;
    }
    return Math.min(Math.floor(value), MAX_TIMEOUT_MS);
}

function toError({ error, operation }: { error: unknown; operation: string }): Error {
    if (error instanceof BrowserlessApiError) {
        return error;
    }
    const response = httpErrorResponse(error);
    if (response !== null) {
        const detail = vendorMessage(response.body);
        return new BrowserlessApiError({
            message: `${operation} failed: ${explainStatus(response.status)}${detail ? `: ${detail}` : ''}`,
            status: response.status,
            responseBody: response.body,
        });
    }
    const message = error instanceof Error ? error.message : String(error);
    if (/abort/i.test(message)) {
        return new BrowserlessApiError({
            message: `${operation} failed: Browserless did not answer before the step deadline. Lower the page wait times or the timeout.`,
            status: null,
            responseBody: null,
        });
    }
    return new BrowserlessApiError({ message: `${operation} failed: ${message}`, status: null, responseBody: null });
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
    if (typeof body === 'string') {
        return Buffer.from(body, 'latin1');
    }
    throw new BrowserlessApiError({ message: 'Browserless returned an unexpected non-binary response.', status: null, responseBody: null });
}

function headerValue({ headers, name }: { headers: ResponseHeaders; name: string }): string | null {
    const value = headers[name.toLowerCase()] ?? headers[name];
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}

function siteResponse(headers: ResponseHeaders): SiteResponse {
    const code = headerValue({ headers, name: 'x-response-code' });
    const parsed = code === null ? NaN : Number(code);
    return {
        site_status_code: Number.isFinite(parsed) ? parsed : null,
        site_status_text: headerValue({ headers, name: 'x-response-status' }),
        final_url: headerValue({ headers, name: 'x-response-url' }),
    };
}

function parseUrl(value: string): URL | null {
    try {
        return new URL(value);
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

function vendorMessage(body: unknown): string | null {
    if (body === null || body === undefined) {
        return null;
    }
    if (typeof body === 'string') {
        return truncate(body);
    }
    if (Buffer.isBuffer(body)) {
        return truncate(body.toString('utf8'));
    }
    if (typeof body === 'object') {
        for (const key of ['message', 'error', 'errors']) {
            const value: unknown = Reflect.get(body, key);
            if (typeof value === 'string' && value.trim() !== '') {
                return truncate(value);
            }
        }
        return truncate(JSON.stringify(body));
    }
    return truncate(String(body));
}

function truncate(text: string): string | null {
    const trimmed = text.trim();
    return trimmed === '' ? null : trimmed.slice(0, 500);
}

function explainStatus(status: number): string {
    switch (status) {
        case 400:
            return 'Browserless rejected the request (400)';
        case 401:
        case 403:
            return `Browserless refused the API token (${status}). Check the token and that it belongs to the selected region or endpoint`;
        case 404:
            return 'Browserless could not find that resource (404)';
        case 408:
            return 'The page did not finish within the timeout (408). Increase the timeout or enable Best Attempt';
        case 429:
            return 'Browserless is rate limiting or your concurrency limit is reached (429). Try again shortly';
        default:
            return status >= 500 ? `Browserless had an internal error (${status})` : `Browserless request failed (${status})`;
    }
}

function cleanQuery(query: Record<string, QueryValue> | undefined): QueryParams {
    const out: QueryParams = {};
    for (const [key, value] of Object.entries(query ?? {})) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        out[key] = String(value);
    }
    return out;
}

const DEFAULT_TIMEOUT_MS = 300_000;
const MAX_TIMEOUT_MS = 540_000;

const BROWSERLESS_REGIONS = [
    'https://production-sfo.browserless.io',
    'https://production-lon.browserless.io',
    'https://production-ams.browserless.io',
];

export class BrowserlessApiError extends Error {
    readonly status: number | null;
    readonly responseBody: unknown;

    constructor({ message, status, responseBody }: { message: string; status: number | null; responseBody: unknown }) {
        super(message);
        this.name = 'BrowserlessApiError';
        this.status = status;
        this.responseBody = responseBody;
    }
}

export interface BrowserlessAuth {
    apiToken: string;
    region: string;
    customBaseUrl?: string;
}

export type QueryValue = string | number | boolean | undefined | null;

export type ResponseHeaders = Record<string, string | string[] | undefined>;

export type BrowserlessResponse<T> = {
    status: number;
    body: T;
    headers: ResponseHeaders;
};

export type SiteResponse = {
    site_status_code: number | null;
    site_status_text: string | null;
    final_url: string | null;
};
