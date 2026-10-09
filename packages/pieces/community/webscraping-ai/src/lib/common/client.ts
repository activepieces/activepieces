import { HttpMethod, HttpResponse, httpClient } from '@activepieces/pieces-common';

import type { WebscrapingAiAuthValue, WebscrapingAiQueryValue } from './types';

function baseUrl(): string {
	return 'https://api.webscraping.ai';
}

async function request<T>({
	auth,
	path,
	query = {},
}: RequestParams & { auth: WebscrapingAiAuthValue }): Promise<HttpResponse<T>> {
	const queryParams = Object.fromEntries(
		Object.entries({ api_key: auth.secret_text, ...query })
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [key, String(value)]),
	);
	return await httpClient.sendRequest<T>({
		method: HttpMethod.GET,
		url: `${baseUrl()}${path}`,
		queryParams,
	});
}

export const webscrapingAiClient = { baseUrl, request };

type RequestParams = { path: string; query?: Record<string, WebscrapingAiQueryValue> };
