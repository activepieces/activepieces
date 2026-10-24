import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { ZohoInvoiceAuthValue } from './types';

function baseUrl({ auth }: { auth: ZohoInvoiceAuthValue }): string {
	return `https://www.zohoapis.${auth.props?.region}/invoice/v3`;
}

function authHeaders({ auth }: { auth: ZohoInvoiceAuthValue }): Record<string, string> {
	return {
		Authorization: `Zoho-oauthtoken ${auth.access_token}`,
	};
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
}: RequestParams & { auth: ZohoInvoiceAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: authHeaders({ auth }),
		queryParams: query,
		body,
	});
	return response.body;
}

export const zohoInvoiceClient = { baseUrl, authHeaders, request };

type RequestParams = { method: HttpMethod; path: string; query?: QueryParams; body?: unknown };
