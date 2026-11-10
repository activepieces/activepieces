import {
	AuthenticationType,
	HttpMethod,
	HttpRequest,
	httpClient,
} from '@activepieces/pieces-common';

const REQUEST_TIMEOUT_MS = 30_000;
const RATE_LIMIT_RETRY_DELAYS_MS = [3_000, 6_000];
const MUTATION_POLL_DELAYS_MS = [1_000, 2_000, 3_000];
const MUTATION_POLL_STEP_MS = 3_000;
const DEFAULT_MUTATION_WAIT_MS = 30_000;
const MIN_POLL_REQUEST_MS = 1_000;
const MAX_ERROR_TEXT = 500;
const DOC_LINK_HOSTS = ['coda.io', 'docs.superhuman.com'];
const DOC_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const COLUMN_ID_PATTERN = /^c-[A-Za-z0-9_-]+$/;

export class CodaApiError extends Error {
	readonly status: number;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
		super(`Coda ${operation} failed (${status}): ${describeStatus({ status, responseBody })}`);
		this.name = 'CodaApiError';
		this.status = status;
		this.responseBody = responseBody;
	}
}

function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string') {
		return responseBody.slice(0, MAX_ERROR_TEXT);
	}
	if (isRecord(responseBody)) {
		const message = responseBody['message'] ?? responseBody['statusMessage'];
		if (typeof message === 'string' && message.length > 0) {
			return message.slice(0, MAX_ERROR_TEXT);
		}
		return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
	}
	return 'no details returned';
}

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
	const detail = vendorMessage(responseBody);
	switch (status) {
		case 401:
			return `the API token is invalid or was revoked. ${detail}`;
		case 403:
			return `Coda refused the request (no access to this doc, or not allowed on this workspace plan). ${detail}`;
		case 404:
			return `not found. Check the IDs or names you passed. ${detail}`;
		case 409:
			return `the doc is not available to the API yet (for example just created or copied); try again in a moment. ${detail}`;
		case 410:
			return `the object was deleted. ${detail}`;
		case 429:
			return `Coda rate limit reached, try again in a few seconds. ${detail}`;
		default:
			return detail;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function statusOf(error: unknown): number | undefined {
	if (error instanceof CodaApiError) {
		return error.status;
	}
	if (!isRecord(error) && !(error instanceof Error)) {
		return undefined;
	}
	const response: unknown = Reflect.get(error, 'response');
	if (isRecord(response) && typeof response['status'] === 'number') {
		return response['status'];
	}
	return undefined;
}

function responseBodyOf(error: unknown): unknown {
	if (!isRecord(error) && !(error instanceof Error)) {
		return undefined;
	}
	const response: unknown = Reflect.get(error, 'response');
	return isRecord(response) ? response['body'] : undefined;
}

function pathSegment({ value, label }: { value: unknown; label: string }): string {
	if (value === undefined || value === null) {
		throw new Error(`${label} is required.`);
	}
	const text = String(value).trim();
	if (text.length === 0) {
		throw new Error(`${label} is required.`);
	}
	if (text === '.' || text === '..') {
		throw new Error(`${label} "${text}" is not a valid Coda ID or name.`);
	}
	return encodeURIComponent(text);
}

function parseDocId(input: unknown): string {
	if (input === undefined || input === null || String(input).trim() === '') {
		throw new Error('Doc ID is required.');
	}
	const text = String(input).trim();
	if (!/^https?:\/\//i.test(text)) {
		if (!DOC_ID_PATTERN.test(text)) {
			throw new Error(`"${text}" is not a valid Coda doc ID. Pass the ID (for example AbC123xyZ) or the doc's browser link.`);
		}
		return text;
	}
	const url = safeUrl(text);
	const host = url?.hostname.toLowerCase().replace(/^www\./, '');
	if (!url || !host || !DOC_LINK_HOSTS.includes(host)) {
		throw new Error(`"${text}" is not a Coda doc link (expected coda.io or docs.superhuman.com).`);
	}
	const parts = url.pathname.split('/').filter((part) => part.length > 0);
	const slug = parts[0] === 'd' ? parts[1] : undefined;
	const marker = slug ? slug.lastIndexOf('_d') : -1;
	const id = slug && marker >= 0 ? slug.slice(marker + 2) : undefined;
	if (!id || !DOC_ID_PATTERN.test(id)) {
		throw new Error(`Could not find a doc ID in "${text}". Paste a link like https://coda.io/d/My-Doc_dAbC123 or the doc ID itself.`);
	}
	return id;
}

function safeUrl(text: string): URL | undefined {
	try {
		return new URL(text);
	} catch {
		return undefined;
	}
}

function docPath(docId: unknown): string {
	return `/docs/${pathSegment({ value: parseDocId(docId), label: 'Doc ID' })}`;
}

function tablePath({ docId, tableIdOrName }: { docId: unknown; tableIdOrName: unknown }): string {
	return `${docPath(docId)}/tables/${pathSegment({ value: tableIdOrName, label: 'Table ID or name' })}`;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function toQueryParams(query: Record<string, CodaQueryValue> | undefined): Record<string, string> {
	if (!query) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(query)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => [key, String(value)]),
	);
}

function authHeaders(token: string): Record<string, string> {
	return { Authorization: `Bearer ${token.trim()}` };
}

async function request<T>({ token, method, path, operation, query, body, wait = sleep, timeoutMs = REQUEST_TIMEOUT_MS, retryRateLimits = true }: CodaRequest): Promise<T> {
	const httpRequest: HttpRequest = {
		method,
		url: `${CODA_BASE_URL}${path}`,
		authentication: { type: AuthenticationType.BEARER_TOKEN, token: token.trim() },
		queryParams: toQueryParams(query),
		timeout: timeoutMs,
		followRedirects: false,
	};
	if (body !== undefined) {
		httpRequest.body = body;
		httpRequest.headers = { 'Content-Type': 'application/json' };
	}
	for (let attempt = 0; ; attempt++) {
		try {
			const response = await httpClient.sendRequest<T>(httpRequest);
			if (response.status >= 300) {
				throw new CodaApiError({ operation, status: response.status, responseBody: response.body });
			}
			return response.body;
		} catch (error) {
			if (error instanceof CodaApiError) {
				throw error;
			}
			const status = statusOf(error);
			if (status === undefined) {
				throw error;
			}
			if (retryRateLimits && (status === 429 || status === 409) && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
				await wait(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
				continue;
			}
			throw new CodaApiError({ operation, status, responseBody: responseBodyOf(error) });
		}
	}
}

async function getMutationStatus({ token, requestId, timeoutMs }: { token: string; requestId: string; timeoutMs?: number }): Promise<MutationStatus> {
	return request<MutationStatus>({
		token,
		method: HttpMethod.GET,
		path: `/mutationStatus/${pathSegment({ value: requestId, label: 'Request ID' })}`,
		operation: 'get mutation status',
		timeoutMs,
		retryRateLimits: timeoutMs === undefined,
	});
}

function isTransientPollError(error: unknown): boolean {
	const status = statusOf(error);
	return status === undefined || status === 404 || status === 408 || status === 409 || status === 429 || status >= 500;
}

function pollRequestBudget({ deadline, now }: { deadline: number; now: () => number }): number | undefined {
	const remaining = deadline - now();
	return remaining < MIN_POLL_REQUEST_MS ? undefined : Math.min(REQUEST_TIMEOUT_MS, remaining);
}

async function withinBudget<T>({ task, ms }: { task: Promise<T>; ms: number }): Promise<{ done: true; value: T } | { done: false }> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const expired = new Promise<{ done: false }>((resolve) => {
		timer = setTimeout(() => resolve({ done: false }), ms);
	});
	task.catch(() => undefined);
	try {
		return await Promise.race([task.then((value) => ({ done: true as const, value })), expired]);
	} finally {
		clearTimeout(timer);
	}
}

async function waitForMutation({
	token,
	requestId,
	timeoutMs = DEFAULT_MUTATION_WAIT_MS,
	now = Date.now,
	wait = sleep,
}: {
	token: string;
	requestId: string;
	timeoutMs?: number;
	now?: () => number;
	wait?: (ms: number) => Promise<void>;
}): Promise<MutationWaitResult> {
	pathSegment({ value: requestId, label: 'Request ID' });
	const deadline = now() + timeoutMs;
	for (let attempt = 0; ; attempt++) {
		const remaining = deadline - now();
		if (remaining <= 0) {
			return { requestId, completed: false, warning: null };
		}
		await wait(Math.min(MUTATION_POLL_DELAYS_MS[attempt] ?? MUTATION_POLL_STEP_MS, remaining));
		const budget = pollRequestBudget({ deadline, now });
		if (budget === undefined) {
			return { requestId, completed: false, warning: null };
		}
		try {
			const poll = await withinBudget({ task: getMutationStatus({ token, requestId, timeoutMs: budget }), ms: budget });
			if (poll.done && poll.value.completed) {
				return { requestId, completed: true, warning: poll.value.warning ?? null };
			}
		} catch (error) {
			if (!isTransientPollError(error)) {
				return {
					requestId,
					completed: false,
					warning: `Coda accepted the change, but checking its status failed, so do not repeat it. Check it later with Get Mutation Status. ${error instanceof Error ? error.message : String(error)}`,
				};
			}
		}
	}
}

async function settleMutation({
	token,
	requestId,
	waitForCompletion,
	wait,
	now,
}: {
	token: string;
	requestId: string | undefined;
	waitForCompletion: boolean | undefined;
	wait?: (ms: number) => Promise<void>;
	now?: () => number;
}): Promise<MutationWaitResult> {
	if (!requestId) {
		throw new Error('Coda accepted the request but returned no request ID, so its outcome cannot be checked.');
	}
	if (waitForCompletion === false) {
		return { requestId, completed: false, warning: null };
	}
	return waitForMutation({ token, requestId, wait, now });
}

function toPageOutput<T>(page: CodaPage<T>): PageOutput<T> {
	const nextPageToken = page.nextPageToken ?? null;
	return { items: page.items ?? [], nextPageToken, hasMore: nextPageToken !== null };
}

function validateLimit({ limit, max }: { limit: unknown; max: number }): number | undefined {
	if (limit === undefined || limit === null || limit === '') {
		return undefined;
	}
	const value = Number(limit);
	if (!Number.isInteger(value) || value < 1 || value > max) {
		throw new Error(`Limit must be a whole number between 1 and ${max}.`);
	}
	return value;
}

function formatQueryValue(value: unknown): string {
	if ((typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean') {
		return String(value);
	}
	return JSON.stringify(String(value ?? ''));
}

function formatQueryColumn(columnIdOrName: string): string {
	const text = columnIdOrName.trim();
	return COLUMN_ID_PATTERN.test(text) ? text : JSON.stringify(text);
}

function buildRowQuery({ column, value }: { column: string; value: unknown }): string {
	return `${formatQueryColumn(column)}:${formatQueryValue(value)}`;
}

function parseJsonInput({ value, label }: { value: unknown; label: string }): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	const text = value.trim();
	if (text.length === 0) {
		return undefined;
	}
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`${label} must be valid JSON.`);
	}
}

export const CODA_BASE_URL = 'https://coda.io/apis/v1';

export const codaApi = {
	request,
	authHeaders,
	pathSegment,
	parseDocId,
	docPath,
	tablePath,
	getMutationStatus,
	waitForMutation,
	settleMutation,
	toPageOutput,
	validateLimit,
	isTransientPollError,
	pollRequestBudget,
	withinBudget,
	buildRowQuery,
	statusOf,
	isRecord,
	parseJsonInput,
	sleep,
};

export type CodaQueryValue = string | number | boolean | undefined | null;

export type CodaRequest = {
	token: string;
	method: HttpMethod;
	path: string;
	operation: string;
	query?: Record<string, CodaQueryValue>;
	body?: unknown;
	wait?: (ms: number) => Promise<void>;
	timeoutMs?: number;
	retryRateLimits?: boolean;
};

export type MutationStatus = {
	completed: boolean;
	warning?: string;
};

export type MutationWaitResult = {
	requestId: string;
	completed: boolean;
	warning: string | null;
};

export type CodaPage<T> = {
	items: T[];
	nextPageToken?: string;
	nextSyncToken?: string;
};

export type PageOutput<T> = {
	items: T[];
	nextPageToken: string | null;
	hasMore: boolean;
};
