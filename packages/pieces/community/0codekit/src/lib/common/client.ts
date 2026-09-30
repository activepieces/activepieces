import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

export const zeroCodeKitApi = {
    request,
    post,
    statusOf,
    describe,
    timeoutFor,
    assertProviderUrl,
};

export const ZEROCODEKIT_BASE_URL = 'https://v2.1saas.co';

export const ZEROCODEKIT_TIMEOUT_MS = {
    lookup: 30_000,
    slow: 60_000,
    file: 120_000,
};

async function request<T>({ apiKey, path, body, timeoutMs }: ZeroCodeKitRequest): Promise<T> {
    const response = await httpClient.sendRequest<T>({
        method: HttpMethod.POST,
        url: `${ZEROCODEKIT_BASE_URL}${path}`,
        headers: {
            auth: apiKey,
        },
        body: compact(body ?? {}),
        timeout: timeoutMs ?? timeoutFor(path),
    });
    return response.body;
}

async function post<T>(params: ZeroCodeKitRequest): Promise<T> {
    try {
        return await request<T>(params);
    } catch (error) {
        throw new Error(describe({ error, fallback: 'The request to 0CodeKit failed.' }));
    }
}

function assertProviderUrl(url: unknown): void {
    if (typeof url !== 'string' || !(url.startsWith('http://') || url.startsWith('https://'))) {
        return;
    }
    const origin = parseOrigin(url);
    if (origin !== new URL(ZEROCODEKIT_BASE_URL).origin) {
        throw new Error(
            `Custom API Call only sends your 0CodeKit API key to ${ZEROCODEKIT_BASE_URL}. Use a path such as /1saas/auth, or a full URL on that host.`,
        );
    }
}

function parseOrigin(url: string): string | undefined {
    try {
        return new URL(url).origin;
    } catch {
        return undefined;
    }
}

function timeoutFor(path: string): number {
    if (FILE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        return ZEROCODEKIT_TIMEOUT_MS.file;
    }
    if (SLOW_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        return ZEROCODEKIT_TIMEOUT_MS.slow;
    }
    return ZEROCODEKIT_TIMEOUT_MS.lookup;
}

function statusOf(error: unknown): number | undefined {
    if (error instanceof HttpError) {
        return error.response.status;
    }
    return undefined;
}

function describe({ error, fallback }: { error: unknown; fallback: string }): string {
    if (isTimeout(error)) {
        return `0CodeKit did not answer in time. ${fallback}`;
    }
    if (!(error instanceof HttpError)) {
        return error instanceof Error ? error.message : fallback;
    }
    const status = error.response.status;
    const body = error.response.body;
    const message = isRecord(body) ? asString(body['errorMessage']) ?? asString(body['message']) : undefined;
    const code = isRecord(body) ? asString(body['code']) : undefined;
    const detail = message ?? fallback;
    const suffix = code === undefined ? '' : ` (${code})`;
    return `0CodeKit returned ${status}: ${detail}${suffix}`;
}

function isTimeout(error: unknown): boolean {
    return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function compact(body: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

const FILE_PATH_PREFIXES = ['/pdf/', '/image/', '/generate/qrcode/', '/storage/temp', '/storage/perm/add', '/storage/perm/get'];

const SLOW_PATH_PREFIXES = ['/ai/', '/operator/urlexpander', '/business/verify/', '/business/validate/email', '/convert/csv/'];

export type ZeroCodeKitRequest = {
    apiKey: string;
    path: string;
    body?: Record<string, unknown>;
    timeoutMs?: number;
};
