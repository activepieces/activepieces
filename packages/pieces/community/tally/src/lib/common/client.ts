import { AuthenticationType, HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/shared';

import type {
	TallyForm,
	TallyFormsResponse,
	TallySubmissionsApiResponse,
	TallyWebhookResponse,
} from './types';

export const TALLY_API_BASE = 'https://api.tally.so';

export const tallyApiClient = {
	validateApiKey,
	listForms,
	createWebhook,
	deleteWebhook,
	fetchRecentSubmissions,
};

async function validateApiKey(apiKey: string): Promise<void> {
	await makeApiCall<TallyFormsResponse>({
		method: HttpMethod.GET,
		path: '/users/me',
		apiKey,
	});
}

async function listForms(apiKey: string): Promise<TallyForm[]> {
	const forms: TallyForm[] = [];
	let page = 1;
	let hasMore = true;

	do {
		const data = await makeApiCall<TallyFormsResponse>({
			method: HttpMethod.GET,
			path: '/forms',
			apiKey,
			queryParams: { page: page.toString(), limit: '100' },
		});

		for (const form of data.items) {
			if (form.status !== 'DELETED') {
				forms.push(form);
			}
		}

		hasMore = data.hasMore;
		page++;
	} while (hasMore);

	return forms;
}

async function createWebhook({
	apiKey,
	formId,
	webhookUrl,
}: {
	apiKey: string;
	formId: string;
	webhookUrl: string;
}): Promise<string> {
	const data = await makeApiCall<TallyWebhookResponse>({
		method: HttpMethod.POST,
		path: '/webhooks',
		apiKey,
		body: {
			formId,
			url: webhookUrl,
			eventTypes: ['FORM_RESPONSE'],
		},
	});
	return data.id;
}

async function deleteWebhook({
	apiKey,
	webhookId,
}: {
	apiKey: string;
	webhookId: string;
}): Promise<void> {
	await makeApiCall<void>({
		method: HttpMethod.DELETE,
		path: `/webhooks/${webhookId}`,
		apiKey,
	});
}

async function fetchRecentSubmissions({
	apiKey,
	formId,
}: {
	apiKey: string;
	formId: string;
}): Promise<TallySubmissionsApiResponse> {
	return makeApiCall<TallySubmissionsApiResponse>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/submissions`,
		apiKey,
		queryParams: { limit: '5', filter: 'completed' },
	});
}

async function makeApiCall<T>({
	method,
	path,
	apiKey,
	body,
	queryParams,
}: MakeApiCallParams): Promise<T> {
	const { data, error } = await tryCatch(() =>
		httpClient.sendRequest<T>({
			method,
			url: `${TALLY_API_BASE}${path}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: apiKey,
			},
			...(body !== undefined ? { body } : {}),
			...(queryParams ? { queryParams } : {}),
		}),
	);

	if (error) {
		if (error instanceof HttpError) {
			const status = error.response.status;
			const responseBody = error.response.body as { message?: string } | undefined;
			if (status === 401) throw new Error('Authentication failed. Check your API key.');
			throw new Error(`API error (${status}): ${responseBody?.message ?? 'Unknown error'}`);
		}
		throw error;
	}

	return data.body;
}

type MakeApiCallParams = {
	method: HttpMethod;
	path: string;
	apiKey: string;
	body?: unknown;
	queryParams?: Record<string, string>;
};
