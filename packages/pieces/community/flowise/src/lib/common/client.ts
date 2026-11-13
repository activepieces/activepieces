import { HttpHeaders, HttpMethod, httpClient } from '@activepieces/pieces-common';

import type { FlowiseAuthValue } from './types';

function baseUrl({ auth }: { auth: FlowiseAuthValue }): string {
	return auth.props.base_url;
}

async function request<T>({
	auth,
	method,
	path,
	query,
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
		queryParams: query ? definedQuery({ query }) : undefined,
		body,
	});
	return response.body;
}

function definedQuery({
	query,
}: {
	query: Record<string, string | undefined>;
}): Record<string, string> {
	return Object.fromEntries(
		Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined),
	);
}

export const flowiseClient = { baseUrl, request };

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: Record<string, string | undefined>;
	body?: unknown;
	headers?: HttpHeaders;
};
