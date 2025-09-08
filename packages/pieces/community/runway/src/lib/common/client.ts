import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.dev.runwayml.com';
const DEFAULT_TIMEOUT = 120000;
const RUNWAY_API_VERSION = '2024-11-06';

export async function runwayRequest<T = any>({
	apiKey,
	method,
	resource,
	body,
	query,
	versionHeader,
	timeout = DEFAULT_TIMEOUT,
	retries = 3,
}: {
	apiKey: string;
	method: HttpMethod;
	resource: string;
	body?: unknown;
	query?: Record<string, string | number | boolean>;
	versionHeader?: string;
	timeout?: number;
	retries?: number;
}): Promise<T> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/json',
	};
	headers['X-Runway-Version'] = versionHeader || RUNWAY_API_VERSION;
	const request: HttpRequest = {
		method,
		url: `${BASE_URL}${resource}`,
		headers,
		body,
		queryParams: query
			? Object.fromEntries(
				Object.entries(query).map(([k, v]) => [k, String(v)])
			  )
			: undefined,
		timeout,
		retries,
	};
	const response = await httpClient.sendRequest<T>(request);
	if (response.status < 200 || response.status >= 300) {
		const err: any = new Error(`Runway API error: ${response.status}`);
		(err.response = response);
		throw err;
	}
	return response.body as T;
}


