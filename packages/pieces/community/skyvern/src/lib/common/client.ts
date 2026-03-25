import {
    httpClient,
    HttpMessageBody,
    HttpMethod,
    HttpRequest,
    QueryParams,
} from '@activepieces/pieces-common';

export type SkyvernApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export const BASE_URL = 'https://api.skyvern.com/v1';

export async function skyvernApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: SkyvernApiCallParams): Promise<T> {
	const qs: QueryParams = {};

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = String(value);
			}
		}
	}

	const request: HttpRequest = {
		method,
		url: BASE_URL + resourceUri,
		headers: {
			'x-api-key': apiKey,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}
