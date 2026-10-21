import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import type { ClockifyAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.clockify.me/api/v1';
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: ClockifyAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		headers: {
			'X-Api-Key': auth.secret_text,
		},
		queryParams: query ?? {},
		body,
	});
	return response.body;
}

export const clockifyClient = { baseUrl, request };

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
};
