import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

import type { ZohoCampaignsAuthValue } from './types';

function baseUrl({ auth }: { auth: ZohoCampaignsAuthValue }): string {
	const location = auth.props?.location || DEFAULT_LOCATION;
	return `https://campaigns.${location}/api/v1.1`;
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
	headers,
}: RequestParams & { auth: ZohoCampaignsAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: {
			Authorization: `Zoho-oauthtoken ${auth.access_token}`,
			'Content-Type': 'application/json',
			...headers,
		},
		queryParams: query,
		body,
	});
	return response.body;
}

export const zohoCampaignsClient = { baseUrl, request };

const DEFAULT_LOCATION = 'zoho.com';

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	headers?: Record<string, string>;
};
