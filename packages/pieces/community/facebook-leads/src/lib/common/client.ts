import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';

import type { FacebookLeadsPaginatedResponse } from './types';

function baseUrl(): string {
	return BASE_URL;
}

async function request<T>({ method, path, query, body }: RequestParams): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${BASE_URL}${path}`,
		queryParams: query,
		body,
	});
	return response.body;
}

async function paginate<T>({ path, query }: PaginateParams): Promise<T[]> {
	const items: T[] = [];
	let url: string | null = `${BASE_URL}${path}`;
	while (url) {
		const response: { body: FacebookLeadsPaginatedResponse<T> } = await httpClient.sendRequest<
			FacebookLeadsPaginatedResponse<T>
		>({
			method: HttpMethod.GET,
			url,
			queryParams: query,
		});
		items.push(...(response.body.data ?? []));
		url = response.body.paging?.next ?? null;
	}
	return items;
}

export const facebookLeadsClient = { baseUrl, request, paginate };

const BASE_URL = 'https://graph.facebook.com';

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
};

type PaginateParams = {
	path: string;
	query?: QueryParams;
};
