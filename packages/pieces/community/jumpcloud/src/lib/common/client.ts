import { httpClient, HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { ApiRecord, ApiVersion, CollectedPage, ConnectionProps, ListPage, PageRequest, PageWindow, PaginationInput } from './types';

export const jumpcloudApi = {
    resolveBaseUrl,
    authHeaders,
    describeError,
    validateConnection,
    send,
    fetchListPage,
    collectPages,
    pageWindow,
    isRecord,
    isNotFound,
};

function resolveBaseUrl({ region }: BaseUrlProps): string {
    return REGION_BASE_URLS[region ?? JUMPCLOUD_REGION.US] ?? REGION_BASE_URLS[JUMPCLOUD_REGION.US];
}

function authHeaders({ apiKey, orgId }: HeaderProps): Record<string, string> {
    const trimmedOrgId = orgId?.trim() ?? '';
    return {
        'x-api-key': apiKey.trim(),
        Accept: 'application/json',
        ...(trimmedOrgId.length > 0 ? { 'x-org-id': trimmedOrgId } : {}),
    };
}

function describeError(error: unknown): string {
    if (!(error instanceof HttpError)) {
        return describeNonHttpError(error);
    }
    const status = error.response.status;
    const detail = readErrorMessage(error.response.body);
    const base = `JumpCloud API error (HTTP ${status})${detail.length > 0 ? `: ${detail}` : ''}`;
    const hint = STATUS_HINTS[status];
    return hint === undefined ? base : `${base}. ${hint}`;
}

async function validateConnection(props: ConnectionProps): Promise<ValidationResult> {
    try {
        const baseUrl = resolveBaseUrl(props);
        await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/systemusers`,
            headers: authHeaders(props),
            queryParams: { limit: '1' },
        });
        return { valid: true };
    } catch (error) {
        return { valid: false, error: describeError(error) };
    }
}

async function send<T>({ auth, method, path, version = 'v1', body, queryParams }: SendParams): Promise<T> {
    const url = `${resolveBaseUrl(auth)}${version === 'v2' ? '/v2' : ''}${path}`;
    try {
        const response = await httpClient.sendRequest<T>({
            method,
            url,
            headers: authHeaders(auth),
            ...(queryParams === undefined ? {} : { queryParams }),
            ...(body === undefined ? {} : { body }),
        });
        return response.body;
    } catch (error) {
        throw new Error(describeError(error), { cause: error });
    }
}

async function fetchListPage(params: SendParams): Promise<ListPage> {
    const body = await send<unknown>(params);
    return parseListBody(body);
}

function pageWindow({ skip, limit, fetchAll, maxItems }: PaginationInput): PageWindow {
    return {
        start: clampInt({ value: skip, min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 }),
        count: fetchAll
            ? clampInt({ value: maxItems, min: 1, max: MAX_FETCH_ALL_ITEMS, fallback: DEFAULT_MAX_ITEMS })
            : clampInt({ value: limit, min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE }),
    };
}

async function collectPages({ fetchPage, ...pagination }: CollectParams): Promise<CollectedPage> {
    const { start, count: target } = pageWindow(pagination);
    let items: ApiRecord[] = [];
    let cursor = start;
    let totalCount: number | undefined;
    while (items.length < target) {
        const pageSize = Math.min(MAX_PAGE_SIZE, target - items.length);
        const page = await fetchPage({ limit: pageSize, skip: cursor });
        items = [...items, ...page.items];
        cursor += page.items.length;
        totalCount = page.totalCount ?? totalCount;
        const reachedEnd = page.items.length < pageSize || (totalCount !== undefined && cursor >= totalCount);
        if (reachedEnd) {
            return { items, total_count: totalCount ?? null, next_skip: null };
        }
    }
    return { items, total_count: totalCount ?? null, next_skip: cursor };
}

function isNotFound(error: unknown): boolean {
    const source = error instanceof Error && error.cause instanceof HttpError ? error.cause : error;
    return source instanceof HttpError && source.response.status === 404;
}

function isRecord(value: unknown): value is ApiRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseListBody(body: unknown): ListPage {
    if (Array.isArray(body)) {
        return { items: body.filter(isRecord) };
    }
    if (isRecord(body) && Array.isArray(body['results'])) {
        const totalCount = body['totalCount'];
        return {
            items: body['results'].filter(isRecord),
            ...(typeof totalCount === 'number' && totalCount >= 0 ? { totalCount } : {}),
        };
    }
    throw new Error('JumpCloud returned an unexpected list response. Run the step again, or use Custom API Call to inspect the raw response.');
}

function clampInt({ value, min, max, fallback }: { value: number | undefined; min: number; max: number; fallback: number }): number {
    if (value === undefined || !Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.trunc(value)));
}

function describeNonHttpError(error: unknown): string {
    if (!(error instanceof Error)) {
        return String(error);
    }
    const code = readCauseCode(error);
    if (error.message !== 'fetch failed' && code === undefined) {
        return error.message;
    }
    const reason = code === undefined ? error.message : code;
    return `Could not reach the JumpCloud API (${reason}). Check the connection region and your network.`;
}

function readCauseCode(error: Error): string | undefined {
    const cause = error.cause;
    if (cause !== null && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string') {
        return cause.code;
    }
    return undefined;
}

function readErrorMessage(body: unknown): string {
    const parsed = typeof body === 'string' ? parseJson(body) : body;
    if (typeof parsed === 'string') {
        const text = parsed.trim();
        if (text.startsWith('<')) {
            return '';
        }
        return text.length > 300 ? `${text.slice(0, 300)}…` : text;
    }
    if (parsed === null || typeof parsed !== 'object') {
        return '';
    }
    if ('message' in parsed && typeof parsed.message === 'string' && parsed.message.length > 0) {
        return parsed.message;
    }
    if ('error' in parsed) {
        const nested = parsed.error;
        if (typeof nested === 'string') {
            return nested;
        }
        if (nested !== null && typeof nested === 'object' && 'message' in nested && typeof nested.message === 'string') {
            return nested.message;
        }
    }
    return '';
}

function parseJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export const JUMPCLOUD_REGION = {
    US: 'us',
    EU: 'eu',
    IN: 'in',
} as const;

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_MAX_ITEMS = 1000;
export const MAX_FETCH_ALL_ITEMS = 10000;
export const COMMAND_POLL_SECONDS = 5;
export const COMMAND_MAX_WAIT_SECONDS = 300;

const REGION_BASE_URLS: Record<string, string> = {
    [JUMPCLOUD_REGION.US]: 'https://console.jumpcloud.com/api',
    [JUMPCLOUD_REGION.EU]: 'https://console.eu.jumpcloud.com/api',
    [JUMPCLOUD_REGION.IN]: 'https://console.in.jumpcloud.com/api',
};

const STATUS_HINTS: Record<number, string> = {
    400: 'Check the values sent to JumpCloud. Multi-tenant admins must also set the Organization ID in the connection.',
    401: 'Check the API key in the connection. In the JumpCloud Admin Portal, open your account menu and choose My API Key.',
    403: 'The admin who owns this API key is not allowed to do this. Check the admin role, and set the Organization ID if you manage several organizations.',
    404: 'Check that the object exists, and that the connection region is correct.',
    429: 'JumpCloud is rate-limiting requests. Wait a minute and run the step again.',
};

type BaseUrlProps = {
    region?: string;
};

type HeaderProps = {
    apiKey: string;
    orgId?: string;
};

type SendParams = {
    auth: ConnectionProps;
    method: HttpMethod;
    path: string;
    version?: ApiVersion;
    body?: unknown;
    queryParams?: QueryParams;
};

type CollectParams = PaginationInput & {
    fetchPage: (page: PageRequest) => Promise<ListPage>;
};

type ValidationResult = { valid: true } | { valid: false; error: string };
