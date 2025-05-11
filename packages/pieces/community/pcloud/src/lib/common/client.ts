import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.pcloud.com';

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown, params?: Record<string, string>) {
	const response = await httpClient.sendRequest({
		method,
		url: `${BASE_URL}${path}`,
		headers: {
			'Authorization': `Bearer ${auth}`,
			'Content-Type': 'application/json',
		},
		body,
		queryParams: params,
	});
	return response.body;
}
