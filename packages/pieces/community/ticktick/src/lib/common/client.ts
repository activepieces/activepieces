import {
    AuthenticationType,
    httpClient,
    HttpMessageBody,
    HttpMethod,
    HttpRequest,
    QueryParams,
} from '@activepieces/pieces-common';

export type TickTickApiCallParams = {
	accessToken: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function tickTickApiCall<T extends HttpMessageBody>({
	accessToken,
	method,
	resourceUri,
	query,
	body,
}: TickTickApiCallParams): Promise<T> {
	const baseUrl = 'https://api.ticktick.com/open/v1';
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
		url: baseUrl + resourceUri,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}
