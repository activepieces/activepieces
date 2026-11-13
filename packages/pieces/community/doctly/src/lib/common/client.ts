import { AuthenticationType, HttpHeaders, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import type { DoctlyAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.doctly.ai/api/v1';
}

async function request<T>({ auth, method, path, query, headers, body }: RequestParams & { auth: DoctlyAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
		queryParams: query === undefined ? undefined : definedOnly({ query }),
		headers,
		body,
	});
	return response.body;
}

function definedOnly({ query }: { query: Record<string, string | undefined> }): QueryParams {
	return Object.fromEntries(Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined));
}

async function download<T>({ url }: { url: string }): Promise<T> {
	const response = await httpClient.sendRequest<T>({ method: HttpMethod.GET, url });
	return response.body;
}

export const doctlyClient = { baseUrl, request, download };

type RequestParams = { method: HttpMethod; path: string; query?: Record<string, string | undefined>; headers?: HttpHeaders; body?: unknown };
