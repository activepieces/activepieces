import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const baseUrl = 'https://www.chatbase.co/api/v1';

async function makeRequest<T>({ apiKey, method, path, body }: MakeRequestParams): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl}${path}`,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body,
	});

	return response.body;
}

export const chatbaseCommon = { baseUrl, makeRequest };

type MakeRequestParams = {
	apiKey: string;
	method: HttpMethod;
	path: string;
	body?: unknown;
};
