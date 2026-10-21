import { HttpMethod, HttpResponse, httpClient } from '@activepieces/pieces-common';

import type { WebscrapingAiAuthValue, WebscrapingAiQueryValue } from './types';

function baseUrl(): string {
	return 'https://api.webscraping.ai';
}

async function request<T>({
	auth,
	method = HttpMethod.GET,
	path,
	query = {},
	body,
	contentType,
}: RequestParams & { auth: WebscrapingAiAuthValue }): Promise<HttpResponse<T>> {
	const entries = Object.entries({ api_key: auth.secret_text, ...query }).filter(
		([, value]) => value !== undefined,
	);
	const queryParams = Object.fromEntries(
		entries.flatMap(([key, value]) => (Array.isArray(value) ? [] : [[key, String(value)]])),
	);
	const repeated = new URLSearchParams(
		entries.flatMap(([key, value]) =>
			Array.isArray(value) ? value.map((item) => [key, item]) : [],
		),
	).toString();
	return await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}${repeated ? `?${repeated}` : ''}`,
		queryParams,
		headers: contentType ? { 'Content-Type': contentType } : undefined,
		body,
	});
}

export const webscrapingAiClient = { baseUrl, request };

type RequestParams = {
	method?: HttpMethod;
	path: string;
	query?: Record<string, WebscrapingAiQueryValue | string[]>;
	body?: string;
	contentType?: string;
};
