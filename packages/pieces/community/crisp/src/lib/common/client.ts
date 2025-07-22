import {
    AuthenticationType,
	httpClient,
	HttpHeaders,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { crispAuth } from './auth';


export const BASE_URL = 'https://api.crisp.chat/v1'

export type CrispApiCallParams = {
	auth: PiecePropValueSchema<typeof crispAuth>;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function crispApiCall<T extends HttpMessageBody>({
	auth,
	method,
	resourceUri,
	query,
	body,
}: CrispApiCallParams): Promise<T> {
	const qs: QueryParams = {};

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = String(value);
			}
		}
	}

	const request: HttpRequest = {
		method,
		url: BASE_URL + resourceUri,
		authentication:{
            type:AuthenticationType.BASIC,
            username:auth.identifier,
            password:auth.token
        },
        headers:{
            'X-Crisp-Tier':'plugin'
        },
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}
