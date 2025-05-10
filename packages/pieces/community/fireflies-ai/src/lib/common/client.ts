import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.fireflies.ai/graphql';

export async function makeRequest(auth: string, method: HttpMethod, query: string, variables?: unknown) {
	const response = await httpClient.sendRequest({
		method,
		url: BASE_URL,
		headers: {
			'Authorization': `Bearer ${auth}`,
			'Content-Type': 'application/json',
		},
		body: {
			query,
			variables
		},
	});
	return response.body;
}

export async function makeRestRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
	const response = await httpClient.sendRequest({
		method,
		url: `https://api.fireflies.ai/v1${path}`,
		headers: {
			'Authorization': `Bearer ${auth}`,
			'Content-Type': 'application/json',
		},
		body,
	});
	return response.body;
}
