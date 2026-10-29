import { HttpMethod, HttpRequest, httpClient, QueryParams } from '@activepieces/pieces-common';

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
	organizationId,
	headers,
	responseType,
}: RequestParams & { auth: ZohoInvoiceAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: {
			...authHeaders({ auth }),
			...(organizationId ? { [ORGANIZATION_HEADER]: organizationId } : {}),
			...headers,
		},
		queryParams: query,
		body,
		responseType,
	});
	return response.body;
}

export const zohoInvoiceClient = { baseUrl, authHeaders, request };

const ORGANIZATION_HEADER = 'X-com-zoho-invoice-organizationid';

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	organizationId?: string;
	headers?: Record<string, string>;
	responseType?: HttpRequest['responseType'];
};
