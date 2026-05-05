import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

function normalizeDomain(domain: string): string {
	return domain.replace(/\/+$/, '');
}

export type ConfluenceApiCallParams = {
	domain: string;
	username: string;
	password: string;
    version: 'v1' | 'v2';
	method: HttpMethod;
	resourceUri: string;
	query?: QueryParams;
	body?: any;
	headers?: Record<string, string>;
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
	headers,
}: ConfluenceApiCallParams): Promise<T> {
	const normalized = normalizeDomain(domain);
	const baseUrl = version === 'v2' ? `${normalized}/wiki/api/v2` : `${normalized}/wiki/rest/api`;

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
		headers,
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
	const normalized = normalizeDomain(domain);

	if (version === 'v2') {
		let nextUrl = `${normalized}/wiki/api/v2${resourceUri}?limit=200`;

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
			nextUrl = response.body?._links?.next ? `${normalized}${response.body._links.next}` : '';
		} while (nextUrl);
	} else {
		let start = 0;
		let hasMoreData = true;

		do {
			const response = await httpClient.sendRequest<{ results: T[] }>({
				method,
				url: `${normalized}/wiki/rest/api${resourceUri}?start=${start}&limit=100`,
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

export type ConfluenceRawRequestParams = {
	domain: string;
	username: string;
	password: string;
	method: HttpMethod;
	url: string;
	query?: QueryParams;
	body?: any;
	headers?: Record<string, string>;
	responseType?: 'arraybuffer' | 'json' | 'blob' | 'text';
	followRedirects?: boolean;
};

export async function confluenceRawRequest<T>({
	domain,
	username,
	password,
	method,
	url,
	query,
	body,
	headers,
	responseType,
	followRedirects,
}: ConfluenceRawRequestParams): Promise<T> {
	const normalized = normalizeDomain(domain);
	const fullUrl = url.startsWith('http') ? url : `${normalized}${url}`;

	const response = await httpClient.sendRequest<T>({
		method,
		url: fullUrl,
		authentication: {
			type: AuthenticationType.BASIC,
			username,
			password,
		},
		queryParams: query,
		body,
		headers,
		responseType,
		followRedirects,
	});
	return response.body;
}

export function escapeStorageValue(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function parsePageIdFromUrl(url: string): string | null {
	const pageIdFromPath = url.match(/\/pages\/(\d+)/);
	if (pageIdFromPath) return pageIdFromPath[1];
	const pageIdFromQuery = url.match(/[?&]pageId=(\d+)/);
	if (pageIdFromQuery) return pageIdFromQuery[1];
	return null;
}
