import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import type { ScrapegraphaiAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.scrapegraphai.com/v1';
}

async function request<T>({
	auth,
	method,
	path,
	body,
}: RequestParams & { auth: ScrapegraphaiAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		headers: {
			'Content-Type': 'application/json',
			'SGAI-APIKEY': auth.secret_text,
		},
		body,
	});
	return response.body;
}

export const scrapegraphaiClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string; body?: unknown };
