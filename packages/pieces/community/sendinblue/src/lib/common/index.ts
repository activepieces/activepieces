import {
	HttpMessageBody,
	HttpMethod,
	QueryParams,
	httpClient,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';

async function apiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: BrevoApiCallParams): Promise<T> {
	const queryParams: QueryParams = {};
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (!isNil(value)) {
				queryParams[key] = String(value);
			}
		}
	}

	const response = await httpClient.sendRequest<T>({
		method,
		url: `${BREVO_API_URL}${resourceUri}`,
		headers: {
			'api-key': apiKey,
			accept: 'application/json',
		},
		queryParams,
		body: compactBody(body),
	});

	return response.body;
}

function compactBody(body: unknown): unknown {
	if (!isPlainObject(body)) {
		return body;
	}
	return Object.fromEntries(
		Object.entries(body).filter(([, value]) => !isNil(value)),
	);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyObject(value: Record<string, unknown> | undefined): boolean {
	return isNil(value) || Object.keys(value).length === 0;
}

export const brevoCommon = { apiCall, isEmptyObject };

export const BREVO_API_URL = 'https://api.brevo.com/v3';

export type BrevoApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | boolean | undefined | null>;
	body?: unknown;
};
