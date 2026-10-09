import { HttpHeaders, HttpMethod, httpClient } from '@activepieces/pieces-common';

import type { FlowiseAuthValue } from './types';

function baseUrl({ auth }: { auth: FlowiseAuthValue }): string {
	return auth.props.base_url;
}

async function request<T>({
	auth,
	method,
	path,
	body,
	headers,
}: RequestParams & { auth: FlowiseAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: {
			...headers,
			Authorization: `Bearer ${auth.props.access_token}`,
		},
		body,
	});
	return response.body;
}

export const flowiseClient = { baseUrl, request };

type RequestParams = {
	method: HttpMethod;
	path: string;
	body?: unknown;
	headers?: HttpHeaders;
};
