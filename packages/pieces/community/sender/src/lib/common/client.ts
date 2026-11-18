import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { SenderAuthValue } from './types';

function baseUrl(): string {
	return BASE_URL;
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: SenderAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${BASE_URL}${path}`,
		headers: {
			Authorization: `Bearer ${auth.secret_text}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		queryParams: query,
		body,
	});
	return response.body;
}

export const senderClient = { baseUrl, request };

const BASE_URL = 'https://api.sender.net/v2';

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
