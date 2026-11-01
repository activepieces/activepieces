import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import type { ClockifyAuthValue } from './types';

function baseUrl(): string {
	return HOSTS.api;
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
	host = 'api',
}: RequestParams & { auth: ClockifyAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${HOSTS[host]}${path}`,
		headers: {
			'X-Api-Key': auth.secret_text,
		},
		queryParams: query ?? {},
		body,
	});
	return response.body;
}

export const clockifyClient = { baseUrl, request };

const HOSTS = {
	api: 'https://api.clockify.me/api/v1',
	reports: 'https://reports.api.clockify.me/v1',
};

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	host?: keyof typeof HOSTS;
};
