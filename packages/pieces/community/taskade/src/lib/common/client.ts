import { AuthenticationType, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

const TASKADE_ORIGIN = 'https://www.taskade.com';
const TASKADE_API = `${TASKADE_ORIGIN}/api`;
const REQUEST_TIMEOUT_MS = 30_000;
const RATE_LIMIT_RETRY_DELAYS_MS = [10_000, 20_000];
const MAX_ERROR_TEXT = 500;
const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const PROJECT_LINK_HOSTS = ['taskade.com', 'www.taskade.com'];

export class TaskadeApiError extends Error {
	readonly status: number;
	readonly code: string | undefined;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
		const code = isRecord(responseBody) && typeof responseBody['code'] === 'string' ? responseBody['code'] : undefined;
		super(`Taskade ${operation} failed (${status}${code ? ` ${code}` : ''}): ${describeStatus({ status, responseBody })}`);
		this.name = 'TaskadeApiError';
		this.status = status;
		this.code = code;
		this.responseBody = responseBody;
	}
}

function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string' && responseBody.length > 0) {
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
			return `the personal access token is invalid or was revoked. ${detail}`;
		case 402: {
			const featureId = isRecord(responseBody) && typeof responseBody['featureId'] === 'string' ? ` (feature: ${responseBody['featureId']})` : '';
			return `this needs more Taskade AI credits or a higher Taskade plan${featureId}. ${detail}`;
		}
		case 403:
			return `Taskade refused the request (no access to this item). ${detail}`;
		case 404:
			return `not found. Check the IDs you passed. ${detail}`;
		case 429:
			return `Taskade rate limit reached (30 requests per minute per token); try again in a minute. ${detail}`;
		default:
			return detail;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function statusOf(error: unknown): number | undefined {
	if (error instanceof TaskadeApiError) {
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

function isNotFound(error: unknown): boolean {
	return statusOf(error) === 404;
}

function seg({ value, label }: { value: unknown; label: string }): string {
	if (value === undefined || value === null) {
		throw new Error(`${label} is required.`);
	}
	const text = String(value).trim();
	if (text.length === 0) {
		throw new Error(`${label} is required.`);
	}
	if (text === '.' || text === '..') {
		throw new Error(`${label} "${text}" is not a valid Taskade ID.`);
	}
	return encodeURIComponent(text);
}

function requireText({ value, label }: { value: unknown; label: string }): string {
	if (value === undefined || value === null || String(value).trim() === '') {
		throw new Error(`${label} is required.`);
	}
	return String(value).trim();
}

function parseId({ value, label }: { value: unknown; label: string }): string {
	const text = requireText({ value, label });
	if (!ID_PATTERN.test(text)) {
		throw new Error(`"${text.slice(0, 100)}" is not a valid ${label}. Pass the ID only (letters, digits, - and _).`);
	}
	return text;
}

function safeUrl(text: string): URL | undefined {
	try {
		return new URL(text);
	} catch {
		return undefined;
	}
}

function parseProjectId(input: unknown): string {
	const text = requireText({ value: input, label: 'Project ID' });
	if (!/^https?:\/\//i.test(text)) {
		return parseId({ value: text, label: 'Project ID' });
	}
	const url = safeUrl(text);
	if (!url || url.protocol !== 'https:' || url.username || url.password || url.port || !PROJECT_LINK_HOSTS.includes(url.hostname.toLowerCase())) {
		throw new Error(`"${text.slice(0, 200)}" is not a Taskade project link (expected https://www.taskade.com/d/<project id>).`);
	}
	const parts = url.pathname.split('/').filter((part) => part.length > 0);
	const id = parts[0] === 'd' ? parts[1] : undefined;
	if (!id || !ID_PATTERN.test(id)) {
		throw new Error(`Could not find a project ID in "${text.slice(0, 200)}". Paste a link like https://www.taskade.com/d/AbCdEfGh12345678 or the project ID itself.`);
	}
	return id;
}

function projectPath(projectId: unknown): string {
	return `/projects/${seg({ value: parseProjectId(projectId), label: 'Project ID' })}`;
}

function taskPath({ projectId, taskId }: { projectId: unknown; taskId: unknown }): string {
	return `${projectPath(projectId)}/tasks/${seg({ value: taskId, label: 'Task ID' })}`;
}

function projectUrl(projectId: string): string {
	return `${TASKADE_ORIGIN}/d/${encodeURIComponent(projectId)}`;
}

function validateInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const number = Number(value);
	if (!Number.isInteger(number) || number < min || number > max) {
		throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
	}
	return number;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function toQueryParams(query: Record<string, TaskadeQueryValue> | undefined): Record<string, string> {
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

async function request<T>({
	token,
	method,
	path,
	version = 'v1',
	operation,
	query,
	body,
	timeoutMs = REQUEST_TIMEOUT_MS,
	wait = sleep,
}: TaskadeRequest): Promise<T> {
	if (!path.startsWith('/')) {
		throw new Error(`Internal error: Taskade path must start with "/" (${operation}).`);
	}
	const httpRequest: HttpRequest = {
		method,
		url: `${TASKADE_API}/${version}${path}`,
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
				throw new TaskadeApiError({ operation, status: response.status, responseBody: response.body });
			}
			const responseBody: unknown = response.body;
			if (isRecord(responseBody) && responseBody['ok'] === false) {
				throw new TaskadeApiError({ operation, status: response.status, responseBody });
			}
			return response.body;
		} catch (error) {
			if (error instanceof TaskadeApiError) {
				throw error;
			}
			const status = statusOf(error);
			if (status === undefined) {
				throw error;
			}
			if (status === 429 && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
				await wait(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
				continue;
			}
			throw new TaskadeApiError({ operation, status, responseBody: responseBodyOf(error) });
		}
	}
}

export const TASKADE_BASE_URL = `${TASKADE_API}/v1`;

export const taskadeApi = {
	request,
	authHeaders,
	seg,
	parseId,
	parseProjectId,
	requireText,
	projectUrl,
	projectPath,
	taskPath,
	validateInteger,
	isNotFound,
	statusOf,
	isRecord,
	safeUrl,
	sleep,
	TASKADE_ORIGIN,
	RATE_LIMIT_RETRY_DELAYS_MS,
};

export type TaskadeQueryValue = string | number | boolean | undefined | null;

export type TaskadeRequest = {
	token: string;
	method: HttpMethod;
	path: string;
	version?: 'v1' | 'v2';
	operation: string;
	query?: Record<string, TaskadeQueryValue>;
	body?: unknown;
	timeoutMs?: number;
	wait?: (ms: number) => Promise<void>;
};
