import {
    httpClient,
    HttpMethod,
    HttpRequest,
    QueryParams,
} from '@activepieces/pieces-common';

/**
 * Shared HTTP plumbing for every Firmaradar action/trigger.
 *
 * All calls go to the canonical REST contract (`/api/openapi.yaml` on the
 * base URL). Auth is the `X-API-Key` header; `X-FR-Client: activepieces`
 * identifies this connector on the backend (rate-limit pool routing +
 * audit trail — same mechanism as the n8n/Make/Power Automate markers).
 */

export const DEFAULT_BASE_URL = 'https://firmaradar.no';
export const CLIENT_MARKER = 'activepieces';

export interface FirmaradarAuthProps {
    apiKey: string;
    baseUrl?: string;
}

/**
 * Unwrap the piece-auth value to the flat `{ apiKey, baseUrl }` props.
 *
 * Framework >= 0.32 ("Context V2") passes the wrapped connection value
 * `{ type: 'CUSTOM_AUTH', props: {...} }` to action/trigger hooks, while
 * `PieceAuth.CustomAuth`'s `validate()` still receives the flat props
 * object. This helper accepts both shapes so every call site can stay
 * shape-agnostic.
 */
export function authProps(auth: unknown): FirmaradarAuthProps {
    const candidate = auth as { props?: FirmaradarAuthProps } | FirmaradarAuthProps | null;
    if (
        candidate &&
        typeof candidate === 'object' &&
        'props' in candidate &&
        candidate.props &&
        typeof candidate.props === 'object'
    ) {
        return candidate.props;
    }
    return candidate as FirmaradarAuthProps;
}

/** Base URL with trailing slashes stripped; empty/unset falls back to prod. */
export function baseUrlOf(auth: FirmaradarAuthProps): string {
    const raw = (auth.baseUrl ?? '').trim() || DEFAULT_BASE_URL;
    return raw.replace(/\/+$/, '');
}

/**
 * Build `QueryParams` from a loose record: `undefined`/`null`/`''` entries
 * are dropped, everything else is stringified (booleans → `1`/`0` is NOT
 * applied here — pass numbers explicitly where the API expects them).
 */
export function queryOf(
    params: Record<string, string | number | boolean | undefined | null>,
): QueryParams {
    const out: QueryParams = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const text = String(value);
        if (text === '') continue;
        out[key] = text;
    }
    return out;
}

export interface FirmaradarRequestOptions {
    method: HttpMethod;
    /** Path starting with `/`, e.g. `/api/v1/companies/search`. */
    path: string;
    query?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    headers?: Record<string, string>;
}

/** Pure request builder — unit-testable without any network access. */
export function buildRequest(auth: unknown, options: FirmaradarRequestOptions): HttpRequest {
    const props = authProps(auth);
    const query = options.query ? queryOf(options.query) : undefined;
    return {
        method: options.method,
        url: `${baseUrlOf(props)}${options.path}`,
        headers: {
            'X-API-Key': props.apiKey,
            'X-FR-Client': CLIENT_MARKER,
            Accept: 'application/json',
            ...(options.headers ?? {}),
        },
        ...(query && Object.keys(query).length > 0 ? { queryParams: query } : {}),
        ...(options.body !== undefined ? { body: options.body } : {}),
    };
}

/** Send a request and return the parsed JSON body. Non-2xx throws HttpError. */
export async function firmaradarRequest<T = unknown>(
    auth: unknown,
    options: FirmaradarRequestOptions,
): Promise<T> {
    const response = await httpClient.sendRequest<T>(buildRequest(auth, options));
    return response.body;
}

/**
 * DPA headers required by the AML endpoints (`/api/v1/aml/*`).
 *
 * The backend enforces a signed data-processing agreement plus a per-call
 * confirmation; failing fast here gives the user an actionable message
 * instead of a backend 403.
 */
export function dpaHeaders(purpose: string, confirmed: boolean): Record<string, string> {
    if (!confirmed) {
        throw new Error(
            'AML screening requires a per-call DPA confirmation. Tick the ' +
                '"I confirm DPA coverage" checkbox to state that a signed data ' +
                'processing agreement covers this screening.',
        );
    }
    return {
        'X-FR-Purpose': purpose,
        'X-FR-DPA-Confirmed': 'true',
    };
}

/** True when an error from `httpClient` represents an HTTP 404 response. */
export function isNotFoundError(error: unknown): boolean {
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    return status === 404;
}
