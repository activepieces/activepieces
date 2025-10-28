import {
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.airparser.com';

export type AirparserApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function airparserApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: AirparserApiCallParams): Promise<T> {
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
		headers: {
			'X-API-Key': apiKey,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export interface GetDocumentResponse {
	json: any;
	_id: string;
	inbox_id: string;
	owner_id: string;
	name: string;
	data_text: string;
	format: string;
	status: string;
	created_at: string;
	processed_at: string;
	secret: string;
	filename: string;
	content_type: string;
	credits: number;
}
