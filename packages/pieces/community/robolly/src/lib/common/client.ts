import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { RobollyAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.robolly.com';
}

async function request<T>({ auth, method, path, query, body }: RequestParams): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		headers: {
			Authorization: `Bearer ${auth.secret_text}`,
		},
		queryParams: query,
		body,
	});
	return response.body;
}

export const robollyClient = { baseUrl, request };

type RequestParams = {
	auth: RobollyAuthValue;
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
};
