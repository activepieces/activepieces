import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export type CloseApiCallParams = {
	accessToken: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export const CLOSE_API_URL = 'https://api.close.com/api/v1';

export async function closeApiCall<T extends HttpMessageBody>({
	accessToken,
	method,
	resourceUri,
	query,
	body,
}: CloseApiCallParams): Promise<T> {
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
		url: CLOSE_API_URL + resourceUri,
		authentication: {
			type: AuthenticationType.BASIC,
			username: accessToken,
			password: '',
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export async function closePaginatedApiCall<T extends HttpMessageBody>({
	accessToken,
	method,
	resourceUri,
	query,
	body,
}: CloseApiCallParams): Promise<T[]> {
	const resultData: T[] = [];
	const limit = 100;
	let skip = 0;
	let hasMore = true;

	do {
		const response = await closeApiCall<{ data: T[]; has_more: boolean }>({
			accessToken,
			method,
			resourceUri,
			query: { ...query, _limit: limit, _skip: skip },
			body,
		});
		const { data, has_more } = response;
		if (!data || data.length === 0) break;

		resultData.push(...data);
		hasMore = has_more;
		skip += limit;
	} while (hasMore);

	return resultData;
}
