import { AuthenticationType, httpClient, HttpMessageBody, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import type { QuickbooksAuthValue } from './types';

function baseUrl({ auth }: { auth: QuickbooksAuthValue }): string {
	return `${QUICKBOOKS_API_URL_SANDBOX}/${auth.props?.['companyId']}`;
}

async function request<T extends HttpMessageBody>({
	auth,
	method,
	path,
	query,
	body,
	timeout,
	accept = 'application/json',
	responseType,
}: RequestParams & { auth: QuickbooksAuthValue }): Promise<T> {
	const queryParams: Record<string, string> = { minorversion: MINOR_VERSION };
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined) {
			queryParams[key] = String(value);
		}
	}

	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth })}${path}`,
		queryParams,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.access_token,
		},
		headers: {
			Accept: accept,
			...(body !== undefined && { 'Content-Type': 'application/json' }),
		},
		body,
		timeout,
		responseType,
	});

	return response.body;
}

export const quickbooksClient = { baseUrl, request };

const QUICKBOOKS_API_URL_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const MINOR_VERSION = '75';

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: Record<string, string | number | boolean | undefined>;
	body?: unknown;
	timeout?: number;
	accept?: string;
	responseType?: HttpRequest['responseType'];
};
