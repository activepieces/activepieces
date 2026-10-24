import { HttpHeaders, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { ZohoBookingsAuthValue } from './types';

function baseUrl({ auth }: { auth: ZohoBookingsAuthValue }): string {
	const location = auth.props?.location || 'zoho.com';
	return `https://www.zohoapis.${location.substring(5).trim()}/bookings/v1/json`;
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
	headers,
}: RequestParams & { auth: ZohoBookingsAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: {
			Authorization: `Zoho-oauthtoken ${auth.access_token}`,
			...headers,
		},
		queryParams: query,
		body,
	});
	return response.body;
}

export const zohoBookingsClient = { baseUrl, request };

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	headers?: HttpHeaders;
};
