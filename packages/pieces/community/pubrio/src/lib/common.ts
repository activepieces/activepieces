import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.pubrio.com';

export async function pubrioRequest(
	apiKey: string,
	method: HttpMethod,
	endpoint: string,
	body?: Record<string, unknown>,
): Promise<unknown> {
	const response = await httpClient.sendRequest({
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			'pubrio-api-key': apiKey,
			'Content-Type': 'application/json',
		},
		body: body && Object.keys(body).length > 0 ? body : undefined,
	});

	const data = response.body as Record<string, unknown>;
	return data.data !== undefined ? data.data : data;
}

export function splitComma(value: string | undefined): string[] | undefined {
	if (!value) return undefined;
	return value
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}
