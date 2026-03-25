import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export const BEEHIIV_API_URL = 'https://api.beehiiv.com/v2';

export type BeehiivApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function beehiivApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: BeehiivApiCallParams): Promise<T> {
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
		url: BEEHIIV_API_URL + resourceUri,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: apiKey,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export async function BeehiivPaginatedApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: BeehiivApiCallParams): Promise<T[]> {
	const resultData: T[] = [];
	const limit = 100;
	let page = 1;
	let totalPages = 1;

	do {
		const response = await beehiivApiCall<{
			data: T[];
			page: number;
			limit: number;
			total_results: number;
			total_pages: number;
		}>({
			apiKey,
			method,
			resourceUri,
			query: {
				...query,
				limit,
				page,
			},
			body,
		});

		const { data, total_pages } = response;

		if (!data || data.length === 0) break;

		resultData.push(...data);
		totalPages = total_pages;
		page += 1;
	} while (page <= totalPages);

	return resultData;
}

export interface WebhookPayload {
	data: Record<string, any>;
	event_timestamp: number;
	event_type: string;
	uid: string;
}
