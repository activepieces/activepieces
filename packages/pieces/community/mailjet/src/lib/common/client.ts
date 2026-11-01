import {
	AuthenticationType,
	HttpHeaders,
	HttpMethod,
	httpClient,
	QueryParams,
} from '@activepieces/pieces-common';

import type { MailjetAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.mailjet.com';
}

async function request<T>({ auth, method, path, query, body, headers }: RequestParams): Promise<T> {
	const response = await httpClient.sendRequest<string>({
		method,
		url: `${baseUrl()}${path}`,
		body,
		headers,
		authentication: {
			type: AuthenticationType.BASIC,
			username: auth.username,
			password: auth.password,
		},
		queryParams: query ?? {},
		responseType: 'text',
	});
	const isJson = String(response.headers?.['content-type'] ?? '').includes('json');
	return isJson && response.body.length > 0
		? JSON.parse(response.body, keepUnsafeIntegersExact)
		: response.body;
}

function keepUnsafeIntegersExact(
	_key: string,
	value: unknown,
	context?: { source?: string },
): unknown {
	const source = context?.source;
	if (
		typeof value === 'number' &&
		!Number.isSafeInteger(value) &&
		source &&
		/^-?\d+$/.test(source)
	) {
		return source;
	}
	return value;
}

export const mailjetClient = { baseUrl, request };

type RequestParams = {
	auth: MailjetAuthValue;
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	headers?: HttpHeaders;
};
