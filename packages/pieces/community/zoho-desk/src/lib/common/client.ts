import FormData from 'form-data';

import { HttpHeaders, HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { isNil, tryCatch } from '@activepieces/pieces-framework';

import type { ZohoDeskAuthValue, ZohoDeskDownload, ZohoDeskFile, ZohoDeskPage } from './types';

function baseUrl({ auth }: { auth: ZohoDeskAuthValue }): string {
	const location = auth.props?.location ?? 'zoho.com';
	return `https://desk.${location}/api/v1`;
}

async function request<T>({
	auth,
	orgId,
	method,
	path,
	query,
	body,
	headers,
}: RequestParams & { auth: ZohoDeskAuthValue; headers?: HttpHeaders }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers: { ...authHeaders({ auth, orgId }), ...headers },
		queryParams: toQueryParams({ query }),
		body,
	});
	return response.body;
}

async function list<T>({
	auth,
	...params
}: RequestParams & { auth: ZohoDeskAuthValue }): Promise<T[]> {
	const response = await request<ZohoDeskPage<T> | ''>({ auth, ...params });
	if (isNil(response) || response === '') {
		return [];
	}
	return response.data;
}

async function upload<T>({
	auth,
	orgId,
	path,
	query,
	file,
}: UploadParams & { auth: ZohoDeskAuthValue }): Promise<T> {
	const form = new FormData();
	form.append('file', file.data, file.filename);
	return await request<T>({
		auth,
		orgId,
		method: HttpMethod.POST,
		path,
		query,
		body: form,
		headers: form.getHeaders(),
	});
}

async function download({
	auth,
	orgId,
	path,
}: DownloadParams & { auth: ZohoDeskAuthValue }): Promise<ZohoDeskDownload> {
	const response = await httpClient.sendRequest<ArrayBuffer>({
		method: HttpMethod.GET,
		url: `${baseUrl({ auth })}${path}`,
		headers: authHeaders({ auth, orgId }),
		responseType: 'arraybuffer',
	});
	const disposition = response.headers?.['content-disposition'];
	return {
		data: Buffer.from(response.body),
		fileName: await parseFileName({ disposition }),
	};
}

async function parseFileName({ disposition }: { disposition: unknown }): Promise<string | undefined> {
	if (typeof disposition !== 'string') {
		return undefined;
	}
	const encoded = ENCODED_FILE_NAME_PATTERN.exec(disposition);
	if (encoded) {
		const { data: decoded } = await tryCatch(async () => decodeURIComponent(encoded[1]));
		if (decoded) {
			return decoded;
		}
	}
	return PLAIN_FILE_NAME_PATTERN.exec(disposition)?.[1] ?? encoded?.[1];
}

function authHeaders({ auth, orgId }: { auth: ZohoDeskAuthValue; orgId?: string }): HttpHeaders {
	const headers: HttpHeaders = {
		Authorization: `Zoho-oauthtoken ${auth.access_token}`,
	};
	if (orgId) {
		headers['orgId'] = orgId;
	}
	return headers;
}

function toQueryParams({ query }: { query?: RequestParams['query'] }): QueryParams {
	const queryParams: QueryParams = {};
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				queryParams[key] = String(value);
			}
		}
	}
	return queryParams;
}

export const zohoDeskClient = { baseUrl, request, list, upload, download };

const ENCODED_FILE_NAME_PATTERN = /filename\*=(?:UTF-8'')?"?([^";]+)"?/i;
const PLAIN_FILE_NAME_PATTERN = /filename="?([^";]+)"?/i;

type RequestParams = {
	orgId?: string;
	method: HttpMethod;
	path: string;
	query?: Record<string, string | number | boolean | string[] | undefined>;
	body?: unknown;
};

type UploadParams = {
	orgId?: string;
	path: string;
	query?: RequestParams['query'];
	file: ZohoDeskFile;
};

type DownloadParams = { orgId?: string; path: string };
