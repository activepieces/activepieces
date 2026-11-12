import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export class BeehiivApiError extends Error {
	readonly status: number;
	readonly code: string | undefined;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
		super(`beehiiv ${operation} failed (HTTP ${status}): ${describeStatus({ status, responseBody })}`);
		this.name = 'BeehiivApiError';
		this.status = status;
		this.code = firstError(responseBody)?.code;
		this.responseBody = responseBody;
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function apiKeyOf(auth: unknown): string {
	const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
	return typeof raw === 'string' ? raw.trim() : '';
}

export function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string') {
		const text = responseBody.trim();
		return text === '' ? 'no details returned' : text.slice(0, MAX_ERROR_TEXT);
	}
	const errors = isRecord(responseBody) && Array.isArray(responseBody['errors']) ? responseBody['errors'].filter(isRecord) : [];
	const parts = errors
		.map((error) => [error['message'], error['code']].filter((part) => typeof part === 'string' && part !== '').join(' - '))
		.filter((text) => text !== '');
	if (parts.length > 0) {
		return parts.join('; ').slice(0, MAX_ERROR_TEXT);
	}
	return 'no details returned';
}

export function isNotFound(error: unknown): boolean {
	return error instanceof BeehiivApiError && error.status === 404;
}

export function buildUrl({ path, query }: { path: string; query?: BeehiivQuery }): string {
	if (!path.startsWith('/') || path.startsWith('//') || path.split('/').includes('..') || path.includes('?') || path.includes('#')) {
		throw new Error('Refusing to send a beehiiv request to an unexpected path.');
	}
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query ?? {})) {
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item !== '') {
					params.append(key, item);
				}
			}
		} else if (value !== undefined && value !== null && value !== '') {
			params.append(key, String(value));
		}
	}
	const text = params.toString();
	return `${BEEHIIV_API_URL}${path}${text === '' ? '' : `?${text}`}`;
}

export function pathFor(segments: string[]): string {
	return segments.map((segment) => `/${encodeURIComponent(segment)}`).join('');
}

export function verifiedTlsDispatcher(): Promise<unknown> {
	verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
	return verifiedTlsAgent;
}

async function request({
	apiKey,
	method,
	path,
	operation,
	query,
	body,
	retryPending = false,
	wait = sleep,
}: BeehiivRequest): Promise<BeehiivResponse> {
	const key = apiKey.trim();
	if (key === '') {
		throw new Error('The beehiiv API key is empty. Reconnect the beehiiv connection.');
	}
	const url = buildUrl({ path, query });
	const dispatcher = await beehiivTransport.getDispatcher();
	const httpRequest: HttpRequest = {
		method: HTTP_METHODS[method],
		url,
		headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
		timeout: REQUEST_TIMEOUT_MS,
		followRedirects: false,
		responseType: 'text',
		redactBodyInErrors: true,
	};
	if (body !== undefined) {
		httpRequest.body = body;
		httpRequest.headers = { ...httpRequest.headers, 'Content-Type': 'application/json' };
	}
	let rateLimitRetries = 0;
	let pendingRetries = 0;
	let pendingWaitedMs = 0;
	for (;;) {
		const response = await send({ request: httpRequest, dispatcher });
		if (response.status === 429) {
			if (method === 'GET' && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
				rateLimitRetries++;
				await wait(RATE_LIMIT_WAIT_MS);
				continue;
			}
			throw new BeehiivApiError({ operation, status: 429, responseBody: response.body });
		}
		if (response.status === 202 && retryPending && method === 'GET') {
			const delay = retryAfterMs({ headers: response.headers });
			if (pendingRetries < MAX_PENDING_RETRIES && pendingWaitedMs + delay <= MAX_PENDING_WAIT_MS) {
				pendingRetries++;
				pendingWaitedMs += delay;
				await wait(delay);
				continue;
			}
			throw new Error(`beehiiv ${operation}: beehiiv is still preparing this content (HTTP 202). Try again in a minute.`);
		}
		if (response.status >= 300 && response.status < 400) {
			throw new BeehiivApiError({ operation, status: response.status, responseBody: 'unexpected redirect, not followed' });
		}
		if (response.status >= 400) {
			throw new BeehiivApiError({ operation, status: response.status, responseBody: response.body });
		}
		return { status: response.status, body: response.body };
	}
}

async function send({ request, dispatcher }: { request: HttpRequest; dispatcher: unknown }): Promise<RawResponse> {
	try {
		const response = await httpClient.sendRequest<string>(request, { dispatcher });
		return { status: response.status, headers: response.headers ?? {}, body: parseBody({ status: response.status, text: response.body }) };
	} catch (error) {
		const failed = failedResponseOf(error);
		if (failed === undefined) {
			throw error;
		}
		return { status: failed.status, headers: {}, body: parseBody({ status: failed.status, text: failed.body }) };
	}
}

async function listPage<T>({ apiKey, path, operation, query, page, limit, retryPending }: BeehiivPageRequest): Promise<BeehiivOffsetPage<T>> {
	const response = await request({
		apiKey,
		method: 'GET',
		path,
		operation,
		query: { ...query, page, limit },
		retryPending,
	});
	return offsetPageOf<T>({ body: response.body, page, limit });
}

async function listAllPaged<T>({
	apiKey,
	path,
	operation,
	query,
	maxItems,
	retryPending,
	deadlineMs = LIST_ALL_DEADLINE_MS,
	now = Date.now,
}: BeehiivListAllRequest): Promise<T[]> {
	const startedAt = now();
	const items: T[] = [];
	for (let page = 1; ; page++) {
		if (page > MAX_OFFSET_PAGE) {
			throw new Error(
				`beehiiv ${operation}: more than ${MAX_OFFSET_PAGE * OFFSET_PAGE_SIZE} items. beehiiv stops offset pagination at page ${MAX_OFFSET_PAGE}; narrow the filters.`,
			);
		}
		if (now() - startedAt > deadlineMs) {
			throw new Error(`beehiiv ${operation}: listing took longer than ${Math.round(deadlineMs / 1000)} s; narrow the filters or use a page.`);
		}
		const result = await listPage<T>({ apiKey, path, operation, query, page, limit: OFFSET_PAGE_SIZE, retryPending });
		items.push(...result.items);
		if (items.length > maxItems) {
			throw new Error(`beehiiv ${operation}: more than ${maxItems} items match. Narrow the filters or use Limit and Page.`);
		}
		if (!result.has_more || result.items.length === 0) {
			return items;
		}
	}
}

async function listCursorPage<T>({ apiKey, path, operation, query, cursor, limit }: BeehiivCursorPageRequest): Promise<BeehiivCursorPage<T>> {
	const response = await request({
		apiKey,
		method: 'GET',
		path,
		operation,
		query: { ...query, limit, cursor },
	});
	return cursorPageOf<T>({ body: response.body });
}

async function listAllCursor<T>({
	apiKey,
	path,
	operation,
	query,
	maxItems,
	deadlineMs = LIST_ALL_DEADLINE_MS,
	now = Date.now,
}: BeehiivListAllRequest): Promise<T[]> {
	const startedAt = now();
	const items: T[] = [];
	let cursor: string | undefined;
	for (;;) {
		if (now() - startedAt > deadlineMs) {
			throw new Error(`beehiiv ${operation}: listing took longer than ${Math.round(deadlineMs / 1000)} s; narrow the filters or use Limit and Cursor.`);
		}
		const result = await listCursorPage<T>({ apiKey, path, operation, query, cursor, limit: OFFSET_PAGE_SIZE });
		items.push(...result.items);
		if (items.length > maxItems) {
			throw new Error(`beehiiv ${operation}: more than ${maxItems} items match. Narrow the filters or use Limit and Cursor.`);
		}
		if (!result.has_more || result.next_cursor === null || result.items.length === 0) {
			return items;
		}
		cursor = result.next_cursor;
	}
}

function offsetPageOf<T>({ body, page, limit }: { body: unknown; page: number; limit: number }): BeehiivOffsetPage<T> {
	const record = isRecord(body) ? body : {};
	const items: T[] = Array.isArray(record['data']) ? record['data'] : [];
	const totalPages = typeof record['total_pages'] === 'number' ? record['total_pages'] : page;
	const totalResults = typeof record['total_results'] === 'number' ? record['total_results'] : items.length;
	return {
		items,
		page: typeof record['page'] === 'number' ? record['page'] : page,
		limit: typeof record['limit'] === 'number' ? record['limit'] : limit,
		total_pages: totalPages,
		total_results: totalResults,
		has_more: page < totalPages,
	};
}

function cursorPageOf<T>({ body }: { body: unknown }): BeehiivCursorPage<T> {
	const record = isRecord(body) ? body : {};
	const items: T[] = Array.isArray(record['data']) ? record['data'] : [];
	const nextCursor = typeof record['next_cursor'] === 'string' && record['next_cursor'] !== '' ? record['next_cursor'] : null;
	return {
		items,
		next_cursor: nextCursor,
		has_more: record['has_more'] === true && nextCursor !== null,
	};
}

function firstError(responseBody: unknown): { message?: string; code?: string } | undefined {
	if (!isRecord(responseBody) || !Array.isArray(responseBody['errors'])) {
		return undefined;
	}
	const first = responseBody['errors'].find(isRecord);
	if (first === undefined) {
		return undefined;
	}
	return {
		message: typeof first['message'] === 'string' ? first['message'] : undefined,
		code: typeof first['code'] === 'string' ? first['code'] : undefined,
	};
}

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
	const detail = vendorMessage(responseBody);
	switch (status) {
		case 401:
			return `the API key is invalid or was revoked; reconnect beehiiv. ${detail}`;
		case 403:
			return `the API key may not access this resource, or the feature is not on your beehiiv plan. ${detail}`;
		case 404:
			return `not found; check the publication and record IDs. ${detail}`;
		case 429:
			return `beehiiv rate limit reached (Free 30, Lite 180, Pro 500, Enterprise 800 requests per minute). Wait a minute and retry. ${detail}`;
		default:
			return status >= 500 ? `beehiiv server error; retry later. ${detail}` : detail;
	}
}

function parseBody({ status, text }: { status: number; text: unknown }): unknown {
	if (typeof text !== 'string') {
		return text ?? undefined;
	}
	if (status === 204 || text.trim() === '') {
		return undefined;
	}
	try {
		return JSON.parse(text);
	} catch {
		return text.slice(0, MAX_ERROR_TEXT);
	}
}

function failedResponseOf(error: unknown): { status: number; body: unknown } | undefined {
	if (!(error instanceof Error)) {
		return undefined;
	}
	const response: unknown = Reflect.get(error, 'response');
	if (!isRecord(response) || typeof response['status'] !== 'number') {
		return undefined;
	}
	return { status: response['status'], body: response['body'] };
}

function headerOf({ headers, name }: { headers: RawHeaders; name: string }): string | null {
	const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
	if (match === undefined || match[1] === undefined) {
		return null;
	}
	return Array.isArray(match[1]) ? (match[1][0] ?? null) : match[1];
}

function retryAfterMs({ headers }: { headers: RawHeaders }): number {
	const retryAfter = Number(headerOf({ headers, name: 'retry-after' }));
	const raw = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : DEFAULT_PENDING_WAIT_MS;
	return Math.min(Math.max(raw, MIN_WAIT_MS), MAX_PENDING_WAIT_MS);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_WAIT_MS = 10_000;
const MAX_PENDING_RETRIES = 3;
const MAX_PENDING_WAIT_MS = 30_000;
const DEFAULT_PENDING_WAIT_MS = 5_000;
const MIN_WAIT_MS = 1_000;
const MAX_ERROR_TEXT = 500;
const OFFSET_PAGE_SIZE = 100;
const MAX_OFFSET_PAGE = 100;
const LIST_ALL_DEADLINE_MS = 240_000;

export const BEEHIIV_API_URL = 'https://api.beehiiv.com/v2';

const HTTP_METHODS: Record<BeehiivMethod, HttpMethod> = {
	GET: HttpMethod.GET,
	POST: HttpMethod.POST,
	PUT: HttpMethod.PUT,
	PATCH: HttpMethod.PATCH,
	DELETE: HttpMethod.DELETE,
};

export const beehiivTransport = {
	getDispatcher: verifiedTlsDispatcher,
};

export const beehiivClient = {
	request,
	listPage,
	listCursorPage,
	listAllPaged,
	listAllCursor,
};

export type BeehiivQueryValue = string | number | boolean | string[] | undefined | null;

export type BeehiivQuery = Record<string, BeehiivQueryValue>;

export type BeehiivMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BeehiivRequest = {
	apiKey: string;
	method: BeehiivMethod;
	path: string;
	operation: string;
	query?: BeehiivQuery;
	body?: unknown;
	retryPending?: boolean;
	wait?: (ms: number) => Promise<void>;
};

export type BeehiivResponse = {
	status: number;
	body: unknown;
};

export type BeehiivPageRequest = {
	apiKey: string;
	path: string;
	operation: string;
	query?: BeehiivQuery;
	page: number;
	limit: number;
	retryPending?: boolean;
};

export type BeehiivCursorPageRequest = {
	apiKey: string;
	path: string;
	operation: string;
	query?: BeehiivQuery;
	cursor?: string;
	limit: number;
};

export type BeehiivListAllRequest = {
	apiKey: string;
	path: string;
	operation: string;
	query?: BeehiivQuery;
	maxItems: number;
	retryPending?: boolean;
	deadlineMs?: number;
	now?: () => number;
};

export type BeehiivOffsetPage<T> = {
	items: T[];
	page: number;
	limit: number;
	total_pages: number;
	total_results: number;
	has_more: boolean;
};

export type BeehiivCursorPage<T> = {
	items: T[];
	next_cursor: string | null;
	has_more: boolean;
};

type RawHeaders = Record<string, string | string[] | undefined>;

type RawResponse = {
	status: number;
	headers: RawHeaders;
	body: unknown;
};

export type WebhookPayload = {
	data: Record<string, unknown>;
	event_timestamp: number;
	event_type: string;
	uid: string;
};
