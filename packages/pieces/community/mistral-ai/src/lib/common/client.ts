import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { Stream } from 'stream';
import { MistralAuthValue, mistralRequest } from './request';

async function call<T>({ auth, method, path, body, queryParams, headers, timeout, responseType }: MistralCallParams): Promise<T> {
	const config = mistralRequest.getConfig(auth);
	for (let attempt = 0; ; attempt++) {
		try {
			const response = await httpClient.sendRequest<T>({
				method,
				url: `${config.baseUrl}${path}`,
				headers: { ...config.headers, ...headers },
				body,
				queryParams: toQueryParams(queryParams),
				timeout,
				responseType,
			});
			return response.body;
		} catch (e) {
			if (isRateLimited(e) && !(body instanceof Stream) && attempt < MAX_RATE_LIMIT_RETRIES) {
				await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
				continue;
			}
			throw new Error(describeError({ error: e, isGateway: config.baseUrl.includes(GATEWAY_HOST) }));
		}
	}
}

function parseJsonInput({ value, fieldName }: { value: unknown; fieldName: string }): unknown {
	if (isNil(value) || value === '') {
		return undefined;
	}
	if (typeof value !== 'string') {
		return value;
	}
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`${fieldName} must be valid JSON.`);
	}
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
}

function contentToText(content: unknown): string | null {
	if (isNil(content)) {
		return null;
	}
	if (typeof content === 'string') {
		return content;
	}
	if (Array.isArray(content)) {
		return content.map((chunk) => (isRecord(chunk) && typeof chunk['text'] === 'string' ? chunk['text'] : '')).join('');
	}
	return null;
}

function compact(obj: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(obj).filter(([, value]) => !isNil(value) && value !== ''));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const mistralApi = { call, parseJsonInput, toStringArray, contentToText, compact, isRecord };

function toQueryParams(params: MistralCallParams['queryParams']): Record<string, string> | undefined {
	if (isNil(params)) {
		return undefined;
	}
	return Object.fromEntries(
		Object.entries(params)
			.filter(([, value]) => !isNil(value) && value !== '')
			.map(([key, value]) => [key, String(value)]),
	);
}

function isRateLimited(error: unknown): boolean {
	return error instanceof HttpError && error.response.status === 429;
}

function describeError({ error, isGateway }: { error: unknown; isGateway: boolean }): string {
	if (!(error instanceof HttpError)) {
		return error instanceof Error ? error.message : String(error);
	}
	const status = error.response.status;
	const detail = extractDetail(error.response.body);
	const suffix = detail ? `: ${detail}` : '';
	switch (status) {
		case 401:
			return 'Mistral rejected the API key (401). Check the connection.';
		case 403:
			return `Mistral denied access to this resource (403)${suffix}`;
		case 404:
			return isGateway
				? `Not found (404). The id may be wrong, or this endpoint is not passed through your Cloudflare AI Gateway${suffix}`
				: `Not found (404). Check the id you passed${suffix}`;
		case 422:
			return `Mistral rejected the request as invalid (422)${suffix}`;
		case 429:
			return `Mistral rate limit or capacity limit reached (429). Wait and try again${suffix}`;
		default:
			return `Mistral request failed (${status})${suffix}`;
	}
}

function extractDetail(body: unknown): string | null {
	if (isNil(body)) {
		return null;
	}
	if (typeof body === 'string') {
		return body.slice(0, 500);
	}
	if (!isRecord(body)) {
		return String(body);
	}
	if (typeof body['message'] === 'string') {
		return body['message'];
	}
	const detail = body['detail'];
	if (typeof detail === 'string') {
		return detail;
	}
	if (Array.isArray(detail)) {
		return detail.map(formatValidationItem).join('; ');
	}
	return JSON.stringify(body).slice(0, 500);
}

function formatValidationItem(item: unknown): string {
	if (!isRecord(item)) {
		return String(item);
	}
	const location = Array.isArray(item['loc']) ? item['loc'].join('.') : '';
	const message = typeof item['msg'] === 'string' ? item['msg'] : '';
	return `${location}: ${message}`;
}

const GATEWAY_HOST = 'gateway.ai.cloudflare.com';
const MAX_RATE_LIMIT_RETRIES = 3;

type MistralCallParams = {
	auth: MistralAuthValue;
	method: HttpMethod;
	path: string;
	body?: unknown;
	queryParams?: Record<string, string | number | boolean | null | undefined>;
	headers?: Record<string, string>;
	timeout?: number;
	responseType?: 'arraybuffer' | 'json';
};
