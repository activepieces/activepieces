import { HttpHeaders, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { ZohoDeskAuthValue } from './types';

function baseUrl({ auth }: { auth: ZohoDeskAuthValue }): string {
	const location = auth.props?.location ?? 'zoho.com';
	return `https://desk.${location}/api/v1`;
}

async function request<T>({
	auth,
	orgId,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: ZohoDeskAuthValue }): Promise<T> {
	const queryParams: QueryParams = {};
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				queryParams[key] = String(value);
			}
		}
	}

	const headers: HttpHeaders = {
		Authorization: `Zoho-oauthtoken ${auth.access_token}`,
	};
	if (orgId) {
		headers['orgId'] = orgId;
	}

	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers,
		queryParams,
		body,
	});
	return response.body;
}

export const zohoDeskClient = { baseUrl, request };

type RequestParams = {
	orgId?: string;
	method: HttpMethod;
	path: string;
	query?: Record<string, string | number | undefined>;
	body?: unknown;
};
