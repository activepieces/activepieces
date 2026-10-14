import { httpClient, HttpMethod, AuthenticationType, HttpError } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.tavily.com';

async function request<T>({
	apiKey,
	method,
	path,
	body,
	queryParams,
	headers,
}: {
	apiKey: string;
	method: HttpMethod;
	path: string;
	body?: Record<string, unknown>;
	queryParams?: Record<string, string>;
	headers?: Record<string, string>;
}): Promise<T> {
	try {
		const response = await httpClient.sendRequest<T>({
			method,
			url: `${BASE_URL}${path}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: apiKey,
			},
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			queryParams,
			body,
		});
		return response.body;
	} catch (e) {
		if (e instanceof HttpError) {
			const status = e.response.status;
			const message = JSON.stringify(e.response.body);
			if (status === 401) {
				throw new Error(`Invalid Tavily API key: ${message}`);
			}
			if (status === 429) {
				throw new Error(`Tavily rate limit exceeded: ${message}`);
			}
			throw new Error(`Tavily API error (${status}): ${message}`);
		}
		throw e;
	}
}

export const tavilyCommon = { request };
