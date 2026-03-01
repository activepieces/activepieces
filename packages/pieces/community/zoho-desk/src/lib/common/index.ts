import {
	httpClient,
	HttpHeaders,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { zohoDeskAuth } from './auth';

export type ZohoDeskApiCallParams = {
	auth: PiecePropValueSchema<typeof zohoDeskAuth>;
	orgId?: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function zohoDeskApiCall<T extends HttpMessageBody>({
	auth,
	orgId,
	method,
	resourceUri,
	query,
	body,
}: ZohoDeskApiCallParams): Promise<T> {
	const location = auth.props?.['location'] ?? 'zoho.com';
	const baseUrl = `https://desk.${location}/api/v1`;
	const qs: QueryParams = {};

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = String(value);
			}
		}
	}

	const headers: HttpHeaders = {
		Authorization: `Zoho-oauthtoken ${auth.access_token}`,
	};

	if (orgId) {
		headers['orgId'] = orgId;
	}

	const request: HttpRequest = {
		method,
		url: baseUrl + resourceUri,
		headers,
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}
