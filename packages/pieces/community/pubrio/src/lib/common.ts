import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.pubrio.com';

export async function pubrioRequest(
	apiKey: unknown,
	method: HttpMethod,
	endpoint: string,
	body?: Record<string, unknown>,
): Promise<unknown> {
	const key = String(apiKey);
	const response = await httpClient.sendRequest({
		method,
		url: `${BASE_URL}${endpoint}`,
		headers: {
			'pubrio-api-key': key,
			'Content-Type': 'application/json',
		},
		body: body && Object.keys(body).length > 0 ? body : undefined,
	});

	const data = response.body;
	if (data !== null && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
		const record: Record<string, unknown> = data;
		return record['data'];
	}
	return data;
}

export function splitComma(value: string | undefined): string[] | undefined {
	if (!value) return undefined;
	return value
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}
