import {
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export type KlaviyoApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
	headers?: Record<string, string>;
};

export const BASE_URL = 'https://a.klaviyo.com/api';

export async function klaviyoApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: KlaviyoApiCallParams): Promise<T> {
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
		url: `${BASE_URL}${resourceUri}`,
		headers: {
			Authorization: `Klaviyo-API-Key ${apiKey}`,
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'revision': '2024-05-15',
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}
