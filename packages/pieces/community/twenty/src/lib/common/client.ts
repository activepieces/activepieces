import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

import type { TwentyAuthValue } from './types';

function baseUrl({ auth }: { auth: TwentyAuthValue }): string {
	return auth.props.base_url.replace(/\/$/, '');
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: TwentyAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: {
			Authorization: `Bearer ${auth.props.api_key}`,
			'Content-Type': 'application/json',
		},
		body,
		queryParams: query,
	});
	return response.body;
}

export const twentyClient = { baseUrl, request };

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
};
