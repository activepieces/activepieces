import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function makeRequest(
	apiKey: string,
	method: HttpMethod,
	path: string,
	body?: unknown,
) {
	const url = `https://www.chatbase.co/api/v1${path}`;

	const response = await httpClient.sendRequest({
		method,
		url,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body,
	});

	return response.body;
}
