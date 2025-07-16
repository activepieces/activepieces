import {
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.airtop.ai/api/v1';

export type AirtopApiCallParams = {
	apiKey: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export type AirtopApiResponse<T = any> = {
	data?: T;
	message?: string;
	error?: string;
	statusCode?: number;
};

export type AirtopSession = {
	id: string;
	status: 'active' | 'inactive' | 'terminated' | 'expired';
	createdAt?: string;
	configuration?: any;
};

export type AirtopWindow = {
	windowId: string;
	targetId: string;
	status?: string;
	url?: string;
};

export type AirtopFile = {
	id: string;
	fileName: string;
	fileType: string;
	size?: number;
	createdAt?: string;
};


export async function airtopApiCall<T extends HttpMessageBody>({
	apiKey,
	method,
	resourceUri,
	query,
	body,
}: AirtopApiCallParams): Promise<T> {
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
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'User-Agent': 'Activepieces-Airtop-Integration',
		},
		queryParams: qs,
		body,
	};

	try {
		const response = await httpClient.sendRequest<T>(request);
		return response.body;
	} catch (error: any) {
		if (error.response?.status === 401 || error.response?.status === 403) {
			throw new Error('Authentication failed. Please check your API key.');
		}
		
		if (error.response?.status === 429) {
			throw new Error('Rate limit exceeded. Please wait a moment and try again.');
		}
		
		if (error.response?.status >= 400 && error.response?.status < 500) {
			throw new Error(`Request failed: ${error.response?.body?.message || error.message}`);
		}

		throw error;
	}
}


export function extractApiData<T>(response: any, fallback: T[] = []): T[] {
	if (!response) return fallback;
	
	// Handle different response structures
	if (Array.isArray(response)) return response;
	if (response.data && Array.isArray(response.data)) return response.data;
	if (response.data?.sessions && Array.isArray(response.data.sessions)) return response.data.sessions;
	if (response.data?.windows && Array.isArray(response.data.windows)) return response.data.windows;
	if (response.data?.files && Array.isArray(response.data.files)) return response.data.files;
	
	return fallback;
}
