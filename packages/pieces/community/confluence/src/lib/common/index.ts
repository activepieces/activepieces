import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

export type ConfluenceApiCallParams = {
	domain: string;
	username: string;
	password: string;
    version: 'v1' | 'v2';
	method: HttpMethod;
	resourceUri: string;
	query?: QueryParams;
	body?: any;
};

export type PaginatedResponse<T> = {
	results: T[];
	_links?: {
		next?: string;
	};
};

export async function confluenceApiCall<T extends HttpMessageBody>({
	domain,
	username,
	password,
	method,
	version,
	resourceUri,
	query,
	body,
}: ConfluenceApiCallParams): Promise<T> {
	const baseUrl = version === 'v2' ? `${domain}/wiki/api/v2` : `${domain}/wiki/rest/api`;

	const request: HttpRequest = {
		method,
		url: baseUrl + resourceUri,
		authentication: {
			type: AuthenticationType.BASIC,
			username,
			password,
		},
		queryParams: query,
		body: body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export async function confluencePaginatedApiCall<T extends HttpMessageBody>({
	domain,
	username,
	password,
	method,
	version,
	resourceUri,
	query,
	body,
}: ConfluenceApiCallParams): Promise<T[]> {
	const qs = query ? query : {};
	const resultData: T[] = [];

	if (version === 'v2') {
		let nextUrl = `${domain}/wiki/api/v2${resourceUri}?limit=200`;

		do {
			const response = await httpClient.sendRequest<PaginatedResponse<T>>({
				method,
				url: nextUrl,
				authentication: {
					type: AuthenticationType.BASIC,
					username,
					password,
				},
				queryParams: qs,
				body,
			});

			if (isNil(response.body.results)) {
				break;
			}
			resultData.push(...response.body.results);
			nextUrl = response.body?._links?.next ? `${domain}${response.body._links.next}` : '';
		} while (nextUrl);
	} else {
		let start = 0;
		let hasMoreData = true;

		do {
			const response = await httpClient.sendRequest<{ results: T[] }>({
				method,
				url: `${domain}/wiki/rest/api${resourceUri}?start=${start}&limit=100`,
				authentication: {
					type: AuthenticationType.BASIC,
					username,
					password,
				},
				queryParams: qs,
				body,
			});
			if (isNil(response.body.results) || response.body.results.length === 0) {
				hasMoreData = false;
			} else {
				resultData.push(...response.body.results);
				start += 100;
			}
		} while (hasMoreData);
	}

	return resultData;
}
