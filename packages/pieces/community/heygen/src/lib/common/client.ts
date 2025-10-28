import {
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export type HeygenApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: unknown;
	apiVersion: 'v1' | 'v2';
};

export const BASE_URL_V1 = 'https://api.heygen.com/v1';
export const BASE_URL_V2 = 'https://api.heygen.com/v2';

export async function heygenApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
	apiVersion,
}: HeygenApiCallParams): Promise<T> {
	const qs: QueryParams = {};

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = String(value);
			}
		}
	}

	const url = (apiVersion === 'v1' ? BASE_URL_V1 : BASE_URL_V2) + resourceUri;

	const request: HttpRequest = {
		method,
		url,
		headers: {
			'X-Api-Key': apiKey,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}
