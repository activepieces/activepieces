import { AuthenticationType, httpClient, HttpHeaders, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import type { WebflowAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.webflow.com';
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
	headers,
}: RequestParams & { auth: WebflowAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.access_token,
		},
		headers,
		queryParams: query,
		body,
	});
	return response.body;
}

async function uploadFile({ url, fields, data, fileName, contentType }: UploadFileParams): Promise<void> {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		form.append(key, String(value));
	}
	form.append('file', new Blob([new Uint8Array(data)], { type: contentType ?? 'application/octet-stream' }), fileName);
	await httpClient.sendRequest({
		method: HttpMethod.POST,
		url,
		body: form,
	});
}

export const webflowClient = { baseUrl, request, uploadFile };

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	headers?: HttpHeaders;
};

type UploadFileParams = {
	url: string;
	fields: Record<string, unknown>;
	data: Buffer;
	fileName: string;
	contentType: string | undefined;
};
