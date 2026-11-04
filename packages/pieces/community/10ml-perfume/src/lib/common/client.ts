import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

export const API_BASE_URL = 'https://mcp.10ml.com/api/v1';

type QueryValue = string | number | boolean | string[] | null | undefined;

export type ApiResult = { status: number; body: Record<string, unknown> };

/** Drops empty values and turns lists into the API's comma lists and booleans into "true"/"false". */
export function toQueryParams(query: Record<string, QueryValue>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(query)) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value)) {
			const list = value.map((v) => String(v).trim()).filter(Boolean);
			if (list.length > 0) out[key] = list.join(',');
		} else {
			out[key] = String(value);
		}
	}
	return out;
}

/**
 * GET one route of the free 10ML Perfume Finder API (no key). The API answers 404 with a useful body
 * (`found: false` plus spelling suggestions), which is returned instead of thrown; every other error
 * fails the step with the API's own message.
 */
export async function apiGet(path: string, query: Record<string, QueryValue> = {}): Promise<ApiResult> {
	try {
		const response = await httpClient.sendRequest<Record<string, unknown>>({
			method: HttpMethod.GET,
			url: `${API_BASE_URL}${path}`,
			queryParams: toQueryParams(query),
			timeout: 30_000,
			retries: 2,
		});
		return { status: response.status, body: response.body };
	} catch (error) {
		if (error instanceof HttpError) {
			const { status, body } = error.response;
			if (status === 404 && isRecord(body)) return { status, body };
			const message = isRecord(body) && isRecord(body['error']) ? body['error']['message'] : undefined;
			throw new Error(
				typeof message === 'string' ? message : `10ML Perfume Finder answered HTTP ${status}`,
			);
		}
		throw error;
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
