import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { SMARTSUITE_API_URL, SMARTSUITE_WEBHOOKS_API_URL } from './constants';

const REQUEST_TIMEOUT_MS = 60_000;
const RATE_LIMIT_RETRY_DELAYS_MS = [2_000, 5_000];
const MAX_ERROR_TEXT = 500;

export class SmartSuiteApiError extends Error {
	readonly status: number;
	readonly responseBody: unknown;

	constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
		super(`SmartSuite ${operation} failed (${status}): ${describeStatus({ status, responseBody })}`);
		this.name = 'SmartSuiteApiError';
		this.status = status;
		this.responseBody = responseBody;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function vendorMessage(responseBody: unknown): string {
	if (typeof responseBody === 'string' && responseBody.length > 0) {
		return responseBody.slice(0, MAX_ERROR_TEXT);
	}
	if (isRecord(responseBody)) {
		for (const key of ['message', 'msg', 'detail', 'error']) {
			const value = responseBody[key];
			if (typeof value === 'string' && value.length > 0) {
				return value.slice(0, MAX_ERROR_TEXT);
			}
		}
		return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
	}
	if (Array.isArray(responseBody)) {
		return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
	}
	return 'no details returned';
}

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
	const detail = vendorMessage(responseBody);
	switch (status) {
		case 401:
			return `the API key or Account ID is invalid. ${detail}`;
		case 402:
			return `this SmartSuite workspace has no API access (the trial or paid plan has expired or does not include the API). ${detail}`;
		case 403:
			return `you do not have permission for this solution, table or record. ${detail}`;
		case 404:
			return `not found. Check the IDs you passed. ${detail}`;
		case 429:
			return `SmartSuite rate limit or monthly API quota reached; try again later. ${detail}`;
		default:
			return detail;
	}
}

function statusOf(error: unknown): number | undefined {
	if (error instanceof SmartSuiteApiError) {
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

function responseOf(error: unknown): Record<string, unknown> | undefined {
	if (!isRecord(error) && !(error instanceof Error)) {
		return undefined;
	}
	const response: unknown = Reflect.get(error, 'response');
	return isRecord(response) ? response : undefined;
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
		throw new Error(`${label} "${text}" is not a valid SmartSuite ID.`);
	}
	return encodeURIComponent(text);
}

function toQueryParams(query: Record<string, SmartSuiteQueryValue> | undefined): Record<string, string> {
	if (!query) {
		return {};
	}
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined && value !== null && value !== '') {
			result[key] = String(value);
		}
	}
	return result;
}

function authHeaders(credentials: SmartSuiteCredentials): Record<string, string> {
	return {
		Authorization: `Token ${credentials.apiKey.trim()}`,
		'ACCOUNT-ID': credentials.accountId.trim(),
	};
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smartSuiteRequest<T>({
	credentials,
	method,
	path,
	operation,
	query,
	body,
	api = 'rest',
	headers,
	wait = sleep,
	deadlineAt,
}: SmartSuiteRequest): Promise<T> {
	const baseUrl = api === 'webhooks' ? SMARTSUITE_WEBHOOKS_API_URL : SMARTSUITE_API_URL;
	const request: HttpRequest = {
		method,
		url: `${baseUrl}${path}`,
		headers: authHeaders(credentials),
		queryParams: toQueryParams(query),
		timeout: REQUEST_TIMEOUT_MS,
		followRedirects: false,
	};
	if (body !== undefined) {
		request.body = body;
		request.headers = { ...request.headers, ...(headers ?? { 'Content-Type': 'application/json' }) };
	}
	for (let attempt = 0; ; attempt++) {
		if (deadlineAt !== undefined) {
			const remaining = deadlineAt - Date.now();
			if (remaining <= 0) {
				throw new Error(`SmartSuite ${operation} ran past its time budget.`);
			}
			request.timeout = Math.min(REQUEST_TIMEOUT_MS, remaining);
		}
		try {
			const response = await httpClient.sendRequest<T>(request);
			if (response.status >= 300) {
				throw new SmartSuiteApiError({ operation, status: response.status, responseBody: response.body });
			}
			return response.body;
		} catch (error) {
			if (error instanceof SmartSuiteApiError) {
				throw error;
			}
			const status = statusOf(error);
			if (status === undefined) {
				throw error;
			}
			const retryFits = deadlineAt === undefined || Date.now() + RATE_LIMIT_RETRY_DELAYS_MS[attempt] < deadlineAt;
			if (status === 429 && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length && retryFits) {
				await wait(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
				continue;
			}
			throw new SmartSuiteApiError({ operation, status, responseBody: responseOf(error)?.['body'] });
		}
	}
}

function credentialsOf(auth: { props: SmartSuiteCredentials }): SmartSuiteCredentials {
	return { apiKey: auth.props.apiKey, accountId: auth.props.accountId };
}

export const smartSuiteClient = {
	request: smartSuiteRequest,
	pathSegment,
	statusOf,
	authHeaders,
	credentialsOf,
};

export type SmartSuiteCredentials = {
	apiKey: string;
	accountId: string;
};

export type SmartSuiteQueryValue = string | number | boolean | undefined | null;

export type SmartSuiteRequest = {
	credentials: SmartSuiteCredentials;
	method: HttpMethod;
	path: string;
	operation: string;
	query?: Record<string, SmartSuiteQueryValue>;
	body?: unknown;
	api?: 'rest' | 'webhooks';
	headers?: Record<string, string>;
	wait?: (ms: number) => Promise<void>;
	deadlineAt?: number;
};
