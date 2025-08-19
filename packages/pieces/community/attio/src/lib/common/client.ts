import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import crypto from 'crypto';

export const BASE_URL = 'https://api.attio.com/v2';

export type AttioApiCallParams = {
	accessToken: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function attioApiCall<T extends HttpMessageBody>({
	accessToken,
	method,
	resourceUri,
	query,
	body,
}: AttioApiCallParams): Promise<T> {
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
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export async function attioPaginatedApiCall<T extends HttpMessageBody>({
	accessToken,
	method,
	resourceUri,
	query,
	body,
}: AttioApiCallParams): Promise<T[]> {
	const limit = 500;
	let offset = 0;

	const resultData: T[] = [];
	let hasMoreItems = true;

	do {
		const qs = {
			...(query || {}),
			limit,
			offset,
		};

		const response = await attioApiCall<{ data: T[] }>({
			accessToken,
			method,
			resourceUri,
			query: qs,
			body,
		});

		if (!response?.data || response.data.length === 0) {
			break;
		}

		resultData.push(...response.data);

		// If fewer than 'limit' items returned, we've reached the last page
		hasMoreItems = response.data.length === limit;
		offset += limit;
	} while (hasMoreItems);

	return resultData;
}

export function verifyWebhookSignature(
	webhookSecret?: string,
	webhookSignatureHeader?: string,
	webhookRawBody?: any,
): boolean {
	if (!webhookSecret || !webhookSignatureHeader || !webhookRawBody) {
		return false;
	}

	try {
		const hmac = crypto.createHmac('sha256', webhookSecret);
		hmac.update(webhookRawBody);
		const expectedSignature = hmac.digest('hex');

		return crypto.timingSafeEqual(
			Buffer.from(webhookSignatureHeader, 'hex'),
			Buffer.from(expectedSignature, 'hex'),
		);
	} catch (error) {
		return false;
	}
}
