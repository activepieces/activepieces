import { HttpMethod, httpClient } from '@activepieces/pieces-common';

function baseUrl(): string {
	return 'https://hacker-news.firebaseio.com/v0';
}

async function request<T>({ method, path }: RequestParams): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
	});
	return response.body;
}

export const hackernewsClient = { baseUrl, request };

type RequestParams = { method: HttpMethod; path: string };
