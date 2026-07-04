import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export const TYPEFULLY_API_URL = 'https://api.typefully.com/v2';

export async function typefullyApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: TypefullyApiCallParams): Promise<T> {
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
		url: TYPEFULLY_API_URL + resourceUri,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: apiKey,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export type TypefullyApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: unknown;
};
