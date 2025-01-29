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
	resourceUri,
	query,
	body,
}: ConfluenceApiCallParams): Promise<T> {
	const baseUrl = `${domain}/wiki/api/v2`;

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
	resourceUri,
	query,
	body,
}: ConfluenceApiCallParams): Promise<T[]> {
	const qs = query ? query : {};
	const resultData: T[] = [];

	let nextUrl = `${domain}/wiki/api/v2/${resourceUri}?limit=200`;

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

	return resultData;
}
