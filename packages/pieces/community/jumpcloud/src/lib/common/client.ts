import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

export const jumpcloudApi = {
    resolveBaseUrl,
    authHeaders,
    describeError,
    validateConnection,
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

export type ConnectionProps = BaseUrlProps & HeaderProps;

type ValidationResult = { valid: true } | { valid: false; error: string };
