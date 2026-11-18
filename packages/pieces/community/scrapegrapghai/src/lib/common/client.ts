import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

import type { ScrapegraphaiAuthValue } from './types';

function baseUrl(): string {
	return 'https://v2-api.scrapegraphai.com/api';
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: ScrapegraphaiAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		headers: {
			'Content-Type': 'application/json',
			'SGAI-APIKEY': auth.secret_text,
		},
		queryParams: query,
		body,
	});
	return response.body;
}

export const scrapegraphaiClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
