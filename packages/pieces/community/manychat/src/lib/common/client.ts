import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export class ManychatApiError extends Error {
	readonly status: number;
	readonly code: string | undefined;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
		const code = vendorCode(responseBody);
		super(`ManyChat ${operation} failed (HTTP ${status}${code === undefined ? '' : `, code ${code}`}): ${describeFailure({ status, code, responseBody })}`);
		this.name = 'ManychatApiError';
		this.status = status;
		this.code = code;
		this.responseBody = responseBody;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function apiKeyOf(auth: unknown): string {
	const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
	return typeof raw === 'string' ? raw.trim() : '';
}

function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string') {
		const text = responseBody.trim();
		return text === '' ? 'no details returned' : text.slice(0, MAX_ERROR_TEXT);
	}
	if (!isRecord(responseBody)) {
		return 'no details returned';
	}
	const parts: string[] = [];
	if (typeof responseBody['message'] === 'string' && responseBody['message'].trim() !== '') {
		parts.push(responseBody['message'].trim());
	}
	for (const detail of detailMessages(responseBody['details'])) {
		if (!parts.includes(detail)) {
			parts.push(detail);
		}
	}
	return parts.length === 0 ? 'no details returned' : parts.join('; ').slice(0, MAX_ERROR_TEXT);
}

function buildUrl({ path, query }: { path: string; query?: ManychatQuery }): string {
	if (!/^\/(page|subscriber|sending)\/[A-Za-z]+$/.test(path)) {
		throw new Error('Refusing to send a ManyChat request to an unexpected path.');
	}
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined && value !== '') {
			params.append(key, String(value));
		}
	}
	const text = params.toString();
	return `${MANYCHAT_API_URL}${path}${text === '' ? '' : `?${text}`}`;
}

function dataOf(body: unknown): unknown {
	return isRecord(body) ? body['data'] : undefined;
}

function recordOf(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

function recordsOf(value: unknown): Record<string, unknown>[] {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}

function verifiedTlsDispatcher(): Promise<unknown> {
	verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
	return verifiedTlsAgent;
}

async function request({ apiKey, method, path, operation, query, body, wait = sleep }: ManychatRequest): Promise<unknown> {
	const key = apiKey.trim();
	if (key === '') {
		throw new Error('The ManyChat API key is empty. Reconnect the ManyChat connection.');
	}
	const httpRequest: HttpRequest = {
		method: method === 'GET' ? HttpMethod.GET : HttpMethod.POST,
		url: buildUrl({ path, query }),
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
	const dispatcher = await manychatTransport.getDispatcher();
	let rateLimitRetries = 0;
	for (;;) {
		const response = await send({ request: httpRequest, dispatcher, operation, method });
		if (response.status === 429 && method === 'GET' && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
			rateLimitRetries++;
			await wait(RATE_LIMIT_WAIT_MS);
			continue;
		}
		if (response.status >= 300 && response.status < 400) {
			throw new ManychatApiError({ operation, status: response.status, responseBody: 'unexpected redirect, not followed' });
		}
		if (response.status >= 300) {
			throw new ManychatApiError({ operation, status: response.status, responseBody: response.body });
		}
		if (!isRecord(response.body) || response.body['status'] !== 'success') {
			throw new ManychatApiError({ operation, status: response.status, responseBody: response.body });
		}
		return response.body;
	}
}

async function send({
	request,
	dispatcher,
	operation,
	method,
}: {
	request: HttpRequest;
	dispatcher: unknown;
	operation: string;
	method: ManychatRequest['method'];
}): Promise<RawResponse> {
	try {
		const response = await httpClient.sendRequest<string>(request, { dispatcher });
		return { status: response.status, body: parseBody(response.body) };
	} catch (error) {
		const failed = failedResponseOf(error);
		if (failed === undefined) {
			throw transportError({ error, operation, method });
		}
		return { status: failed.status, body: parseBody(failed.body) };
	}
}

function transportError({ error, operation, method }: { error: unknown; operation: string; method: ManychatRequest['method'] }): Error {
	if (error instanceof Error && error.name === 'AbortError') {
		const unknownOutcome = method === 'POST' ? ' It may still have been applied; check ManyChat before retrying.' : '';
		return new Error(`ManyChat ${operation} did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.${unknownOutcome}`);
	}
	const detail = error instanceof Error ? error.message : String(error);
	return new Error(`Could not reach ManyChat for ${operation}: ${detail}.`);
}

function detailMessages(details: unknown): string[] {
	if (!isRecord(details)) {
		return [];
	}
	const raw = details['messages'];
	const groups: unknown[] = Array.isArray(raw) ? raw : isRecord(raw) ? Object.values(raw) : [];
	const texts: string[] = [];
	for (const group of groups) {
		const items: unknown[] = Array.isArray(group) ? group : [group];
		for (const item of items) {
			if (typeof item === 'string' && item.trim() !== '') {
				texts.push(item.trim());
			} else if (isRecord(item) && typeof item['message'] === 'string' && item['message'].trim() !== '') {
				texts.push(item['message'].trim());
			}
		}
	}
	return texts;
}

function vendorCode(responseBody: unknown): string | undefined {
	if (!isRecord(responseBody)) {
		return undefined;
	}
	const code = responseBody['code'];
	if (typeof code === 'number' || (typeof code === 'string' && code.trim() !== '')) {
		return String(code).trim();
	}
	return undefined;
}

function describeFailure({ status, code, responseBody }: { status: number; code: string | undefined; responseBody: unknown }): string {
	const detail = vendorMessage(responseBody);
	const hint = codeHint(code) ?? statusHint({ status, detail });
	return hint === undefined ? detail : `${hint} ${detail}`;
}

function codeHint(code: string | undefined): string | undefined {
	if (code === undefined) {
		return undefined;
	}
	if (code === '3011') {
		return 'The subscriber is outside the 24-hour messaging window; pick a Message Tag or wait until the subscriber writes again.';
	}
	if (code === '3021') {
		return 'The subscriber has no one-time notification token for this topic.';
	}
	if (code === '3031') {
		return 'A notification reason is required to message this subscriber.';
	}
	if (/^304\d$/.test(code)) {
		return 'This channel cannot deliver the message to the subscriber (for example the channel is disconnected or the subscriber opted out).';
	}
	if (code === '2011' || code === '2012') {
		return 'The subscriber was not found for this user reference.';
	}
	return undefined;
}

function statusHint({ status, detail }: { status: number; detail: string }): string | undefined {
	if (status === 401) {
		return 'The API key is invalid or was regenerated; reconnect ManyChat.';
	}
	if (status === 403 || /\bpro\b/i.test(detail)) {
		return 'The ManyChat API needs a Pro plan, or the key cannot access this resource.';
	}
	if (status === 429) {
		return 'ManyChat rate limit reached. Limits are per account and ManyChat may block an account that keeps exceeding them, so slow the flow down before retrying.';
	}
	if (status >= 500) {
		return 'ManyChat server error; retry later.';
	}
	return undefined;
}

function parseBody(text: unknown): unknown {
	if (typeof text !== 'string') {
		return text ?? undefined;
	}
	if (text.trim() === '') {
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

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RATE_LIMIT_RETRIES = 1;
const RATE_LIMIT_WAIT_MS = 2_000;
const MAX_ERROR_TEXT = 500;

export const MANYCHAT_API_URL = 'https://api.manychat.com/fb';

export const manychatTransport = {
	getDispatcher: verifiedTlsDispatcher,
};

export const manychatClient = {
	request,
};

export const manychatUtils = {
	isRecord,
	apiKeyOf,
	vendorMessage,
	buildUrl,
	dataOf,
	recordOf,
	recordsOf,
};

export type ManychatQueryValue = string | number | undefined;

export type ManychatQuery = Record<string, ManychatQueryValue>;

export type ManychatRequest = {
	apiKey: string;
	method: 'GET' | 'POST';
	path: string;
	operation: string;
	query?: ManychatQuery;
	body?: unknown;
	wait?: (ms: number) => Promise<void>;
};

type RawResponse = {
	status: number;
	body: unknown;
};
