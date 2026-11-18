import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	QueryParams,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';

import type { ConfluenceAuthValue, ConfluencePaginatedResponse } from './types';

function domainUrl({ auth }: { auth: ConfluenceAuthValue }): string {
	return auth.props.confluenceDomain.replace(/\/+$/, '');
}

function baseUrl({ auth }: { auth: ConfluenceAuthValue }): string {
	return `${domainUrl({ auth })}/wiki`;
}

async function sendRequest<T>({
	auth,
	url,
	method,
	query,
	body,
	headers,
	responseType,
	followRedirects,
}: Omit<RequestParams, 'path'> & { auth: ConfluenceAuthValue; url: string }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url,
		authentication: {
			type: AuthenticationType.BASIC,
			username: auth.props.username,
			password: auth.props.password,
		},
		queryParams: query,
		body,
		headers,
		responseType,
		followRedirects,
	});
	return response.body;
}

async function request<T>({
	auth,
	path,
	...rest
}: RequestParams & { auth: ConfluenceAuthValue }): Promise<T> {
	return await sendRequest<T>({ auth, url: `${baseUrl({ auth })}${path}`, ...rest });
}

async function paginateCursor<T>({
	auth,
	path,
	query,
}: PaginateParams & { auth: ConfluenceAuthValue }): Promise<T[]> {
	const items: T[] = [];
	let nextUrl = `${baseUrl({ auth })}${path}?limit=${CURSOR_PAGE_SIZE}`;
	do {
		const response = await sendRequest<ConfluencePaginatedResponse<T>>({
			auth,
			method: HttpMethod.GET,
			url: nextUrl,
			query: query ?? {},
		});
		if (isNil(response.results)) {
			break;
		}
		items.push(...response.results);
		nextUrl = response._links?.next ? `${domainUrl({ auth })}${response._links.next}` : '';
	} while (nextUrl);
	return items;
}

async function paginateOffset<T>({
	auth,
	path,
	query,
}: PaginateParams & { auth: ConfluenceAuthValue }): Promise<T[]> {
	const items: T[] = [];
	for (let start = 0; ; start += OFFSET_PAGE_SIZE) {
		const response = await sendRequest<ConfluencePaginatedResponse<T>>({
			auth,
			method: HttpMethod.GET,
			url: `${baseUrl({ auth })}${path}?start=${start}&limit=${OFFSET_PAGE_SIZE}`,
			query: query ?? {},
		});
		if (isNil(response.results) || response.results.length === 0) {
			break;
		}
		items.push(...response.results);
	}
	return items;
}

export const confluenceClient = { baseUrl, request, paginateCursor, paginateOffset };

const CURSOR_PAGE_SIZE = 200;
const OFFSET_PAGE_SIZE = 100;

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	headers?: Record<string, string>;
	responseType?: 'arraybuffer' | 'json' | 'blob' | 'text';
	followRedirects?: boolean;
};

type PaginateParams = { path: string; query?: QueryParams };
