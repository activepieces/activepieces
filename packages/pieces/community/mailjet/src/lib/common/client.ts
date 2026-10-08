import {
	AuthenticationType,
	HttpMethod,
	httpClient,
	QueryParams,
} from '@activepieces/pieces-common';

import type { MailjetAuthValue } from './types';

function baseUrl(): string {
	return 'https://api.mailjet.com';
}

async function request<T>({ auth, method, path, query, body }: RequestParams): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl()}${path}`,
		body,
		authentication: {
			type: AuthenticationType.BASIC,
			username: auth.username,
			password: auth.password,
		},
		queryParams: query ?? {},
	});
	return response.body;
}

export const mailjetClient = { baseUrl, request };

type RequestParams = {
	auth: MailjetAuthValue;
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
};
