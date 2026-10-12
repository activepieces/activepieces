import {
	AuthenticationType,
	HttpMethod,
	httpClient,
	QueryParams,
} from '@activepieces/pieces-common';

import type { GoogleTranslateAuthValue } from './types';

function baseUrl(): string {
	return 'https://translation.googleapis.com';
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: GoogleTranslateAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
		queryParams: query,
		body,
	});
	return response.body;
}

export const googleTranslateClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
