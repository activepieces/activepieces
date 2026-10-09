import {
	AuthenticationType,
	HttpHeaders,
	HttpMethod,
	httpClient,
	QueryParams,
} from '@activepieces/pieces-common';

import type { OpnformAuthValue } from './types';

function baseUrl({ auth }: { auth?: OpnformAuthValue }): string {
	return auth?.props.baseApiUrl || API_URL_DEFAULT;
}

async function request<T>({ auth, method, path, query, body, headers }: RequestParams): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		headers,
		body,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.props.apiKey,
		},
		queryParams: query,
	});
	return response.body;
}

export const opnformClient = { baseUrl, request };

const API_URL_DEFAULT = 'https://api.opnform.com';

type RequestParams = {
	auth: OpnformAuthValue;
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	headers?: HttpHeaders;
};
