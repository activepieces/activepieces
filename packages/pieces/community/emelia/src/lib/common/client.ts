import { HttpError, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

async function request<T>({ apiKey, method, path, queryParams, body }: RequestParams): Promise<T> {
	try {
		const response = await httpClient.sendRequest<T>({
			method,
			url: `${BASE_URL}${path}`,
			headers: { Authorization: apiKey },
			queryParams,
			body,
			timeout: REQUEST_TIMEOUT_MS,
		});
		return response.body;
	} catch (error) {
		throw toEmeliaError({ error });
	}
}

function errorCode({ error }: { error: unknown }): string | undefined {
	return error instanceof EmeliaApiError ? error.code : undefined;
}

function errorStatus({ error }: { error: unknown }): number | undefined {
	return error instanceof EmeliaApiError ? error.status : undefined;
}

function sleep({ ms }: { ms: number }): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function toEmeliaError({ error }: { error: unknown }): Error {
	if (!(error instanceof HttpError)) {
		return error instanceof Error ? error : new Error(String(error));
	}
	const { status, body } = error.response;
	const message = vendorMessage({ body });
	const code = isRecord(body) && typeof body['code'] === 'string' ? body['code'] : undefined;
	return new EmeliaApiError({
		status,
		code,
		message: `Emelia request failed (${status}${code ? `, ${code}` : ''}): ${describeStatus({ status, message })}`,
	});
}

function describeStatus({ status, message }: { status: number; message: string }): string {
	switch (status) {
		case 401:
			return `the API key was rejected, or the requested campaign does not exist. Check the key in Emelia under Settings, API & Webhooks. ${message}`;
		case 404:
			return `not found. Check the selected campaign, list or contact. ${message}`;
		case 429:
		case 500:
			return `Emelia returned an error. This also happens when the per-minute API quota of your account is exceeded: wait a minute and try again. ${message}`;
		default:
			return message;
	}
}

function vendorMessage({ body }: { body: unknown }): string {
	if (typeof body === 'string') {
		return body.slice(0, MAX_ERROR_TEXT);
	}
	if (isRecord(body)) {
		const message = body['error'] ?? body['message'];
		if (typeof message === 'string' && message.length > 0) {
			return message.slice(0, MAX_ERROR_TEXT);
		}
		return JSON.stringify(body).slice(0, MAX_ERROR_TEXT);
	}
	return 'no details returned';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString({ source, key }: { source: unknown; key: string }): string | null {
	if (!isRecord(source)) {
		return null;
	}
	const value = source[key];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return null;
}

class EmeliaApiError extends Error {
	readonly status: number;
	readonly code: string | undefined;

	constructor({ status, code, message }: { status: number; code: string | undefined; message: string }) {
		super(message);
		this.name = 'EmeliaApiError';
		this.status = status;
		this.code = code;
	}
}

const BASE_URL = 'https://api.emelia.io';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 500;

export const emeliaClient = {
	BASE_URL,
	request,
	errorCode,
	errorStatus,
	sleep,
	isRecord,
	readString,
};

type RequestParams = {
	apiKey: string;
	method: HttpMethod;
	path: string;
	queryParams?: QueryParams;
	body?: unknown;
};
