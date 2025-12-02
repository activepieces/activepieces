import {
	httpClient,
	HttpMethod,
	HttpMessageBody,
	QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.documentpro.ai';

type DocumentProApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: QueryParams;
	body?: unknown;
};

export async function documentProApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: DocumentProApiCallParams): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${BASE_URL}${resourceUri}`,
		headers: {
			'x-api-key': apiKey,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		queryParams: query,
		body,
	});

	return response.body;
}

