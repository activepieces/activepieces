import { HttpMethod, HttpResponse, httpClient } from '@activepieces/pieces-common';

import type { MauticAuthValue } from './types';

function baseUrl({ auth }: { auth: MauticAuthValue }): string {
	const { base_url } = auth.props;
	return `${base_url.endsWith('/') ? base_url : base_url + '/'}api/`;
}

async function request<T>({
	auth,
	method,
	path,
	body,
	queryParams,
	headers,
	responseType,
}: RequestParams): Promise<HttpResponse<T>> {
	const { username, password } = auth.props;
	return await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		body,
		queryParams,
		responseType,
		headers: {
			Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
			...(headers ?? { 'Content-Type': 'application/json' }),
		},
	});
}

export const mauticClient = { baseUrl, request };

type RequestParams = {
	auth: MauticAuthValue;
	method: HttpMethod;
	path: string;
	body?: unknown;
	queryParams?: Record<string, string>;
	headers?: Record<string, string>;
	responseType?: 'arraybuffer';
};
