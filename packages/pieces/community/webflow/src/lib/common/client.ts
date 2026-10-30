import { AuthenticationType, httpClient, HttpHeaders, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import type { WebflowAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.webflow.com';
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
	headers,
}: RequestParams & { auth: WebflowAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.access_token,
		},
		headers,
		queryParams: query,
		body,
	});
	return response.body;
}

export const webflowClient = { baseUrl, request };

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	headers?: HttpHeaders;
};
