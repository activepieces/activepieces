import { AuthenticationType, HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { spreadIfDefined, tryCatch } from '@activepieces/pieces-framework';

import type {
	TallyFolder,
	TallyForm,
	TallyFormDetail,
	TallyFormDimensionsAnalytics,
	TallyFormDropOffAnalytics,
	TallyFormMetrics,
	TallyFormSubmissionAnalytics,
	TallyFormVisitAnalytics,
	TallyFormsResponse,
	TallyGetSubmissionResponse,
	TallyListFormQuestionsResponse,
	TallyListSubmissionsResponse,
	TallyListWorkspacesResponse,
	TallySubmissionsApiResponse,
	TallyCurrentUser,
	TallyWebhookResponse,
	TallyWorkspace,
} from './types';

export type TallyAnalyticsPeriod =
	| 'today'
	| 'yesterday'
	| '24h'
	| '7d'
	| '30d'
	| '3m'
	| '6m'
	| '12m'
	| 'all';

export const TALLY_API_BASE = 'https://api.tally.so';

export const tallyApiClient = {
	validateApiKey,
	listForms,
	createWebhook,
	deleteWebhook,
	fetchRecentSubmissions,
	listFormsPage,
	createForm,
	getForm,
	updateForm,
	deleteForm,
	listFormQuestions,
	listSubmissions,
	getSubmission,
	deleteSubmission,
	getFormMetrics,
	getFormVisitAnalytics,
	getFormSubmissionAnalytics,
	getFormAnalyticsDimensions,
	getFormDropOffAnalytics,
	listWorkspaces,
	createWorkspace,
	getWorkspace,
	renameWorkspace,
	deleteWorkspace,
	listWorkspaceFolders,
	createFolder,
	renameFolder,
	deleteFolder,
	getCurrentUser,
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

async function listFormsPage({
	apiKey,
	page,
	limit,
}: {
	apiKey: string;
	page?: number;
	limit?: number;
}): Promise<TallyFormsResponse> {
	return makeApiCall<TallyFormsResponse>({
		method: HttpMethod.GET,
		path: '/forms',
		apiKey,
		queryParams: {
			...spreadIfDefined('page', page?.toString()),
			...spreadIfDefined('limit', limit?.toString()),
		},
	});
}

async function createForm({
	apiKey,
	blocks,
	status,
	workspaceId,
	templateId,
	folderId,
	settings,
}: {
	apiKey: string;
	blocks: unknown;
	status: string;
	workspaceId?: string;
	templateId?: string;
	folderId?: string;
	settings?: unknown;
}): Promise<TallyFormDetail> {
	return makeApiCall<TallyFormDetail>({
		method: HttpMethod.POST,
		path: '/forms',
		apiKey,
		body: {
			blocks,
			status,
			...spreadIfDefined('workspaceId', workspaceId),
			...spreadIfDefined('templateId', templateId),
			...spreadIfDefined('folderId', folderId),
			...spreadIfDefined('settings', settings),
		},
	});
}

async function getForm({ apiKey, formId }: { apiKey: string; formId: string }): Promise<TallyFormDetail> {
	return makeApiCall<TallyFormDetail>({
		method: HttpMethod.GET,
		path: `/forms/${formId}`,
		apiKey,
	});
}

async function updateForm({
	apiKey,
	formId,
	name,
	status,
	blocks,
	settings,
}: {
	apiKey: string;
	formId: string;
	name?: string;
	status?: string;
	blocks?: unknown;
	settings?: unknown;
}): Promise<TallyFormDetail> {
	return makeApiCall<TallyFormDetail>({
		method: HttpMethod.PATCH,
		path: `/forms/${formId}`,
		apiKey,
		body: {
			...spreadIfDefined('name', name),
			...spreadIfDefined('status', status),
			...spreadIfDefined('blocks', blocks),
			...spreadIfDefined('settings', settings),
		},
	});
}

async function deleteForm({ apiKey, formId }: { apiKey: string; formId: string }): Promise<void> {
	await makeApiCall<void>({
		method: HttpMethod.DELETE,
		path: `/forms/${formId}`,
		apiKey,
	});
}

async function listFormQuestions({
	apiKey,
	formId,
}: {
	apiKey: string;
	formId: string;
}): Promise<TallyListFormQuestionsResponse> {
	return makeApiCall<TallyListFormQuestionsResponse>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/questions`,
		apiKey,
	});
}

async function listSubmissions({
	apiKey,
	formId,
	page,
	limit,
	filter,
	startDate,
	endDate,
	afterId,
}: {
	apiKey: string;
	formId: string;
	page?: number;
	limit?: number;
	filter?: string;
	startDate?: string;
	endDate?: string;
	afterId?: string;
}): Promise<TallyListSubmissionsResponse> {
	return makeApiCall<TallyListSubmissionsResponse>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/submissions`,
		apiKey,
		queryParams: {
			...spreadIfDefined('page', page?.toString()),
			...spreadIfDefined('limit', limit?.toString()),
			...spreadIfDefined('filter', filter),
			...spreadIfDefined('startDate', startDate),
			...spreadIfDefined('endDate', endDate),
			...spreadIfDefined('afterId', afterId),
		},
	});
}

async function getSubmission({
	apiKey,
	formId,
	submissionId,
}: {
	apiKey: string;
	formId: string;
	submissionId: string;
}): Promise<TallyGetSubmissionResponse> {
	return makeApiCall<TallyGetSubmissionResponse>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/submissions/${submissionId}`,
		apiKey,
	});
}

async function deleteSubmission({
	apiKey,
	formId,
	submissionId,
}: {
	apiKey: string;
	formId: string;
	submissionId: string;
}): Promise<void> {
	await makeApiCall<void>({
		method: HttpMethod.DELETE,
		path: `/forms/${formId}/submissions/${submissionId}`,
		apiKey,
	});
}

async function getFormMetrics({
	apiKey,
	formId,
	period,
}: {
	apiKey: string;
	formId: string;
	period: TallyAnalyticsPeriod;
}): Promise<TallyFormMetrics> {
	return makeApiCall<TallyFormMetrics>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/analytics/metrics`,
		apiKey,
		queryParams: { period },
	});
}

async function getFormVisitAnalytics({
	apiKey,
	formId,
	period,
}: {
	apiKey: string;
	formId: string;
	period: TallyAnalyticsPeriod;
}): Promise<TallyFormVisitAnalytics> {
	return makeApiCall<TallyFormVisitAnalytics>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/analytics/visits`,
		apiKey,
		queryParams: { period },
	});
}

async function getFormSubmissionAnalytics({
	apiKey,
	formId,
	period,
}: {
	apiKey: string;
	formId: string;
	period: TallyAnalyticsPeriod;
}): Promise<TallyFormSubmissionAnalytics> {
	return makeApiCall<TallyFormSubmissionAnalytics>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/analytics/submissions`,
		apiKey,
		queryParams: { period },
	});
}

async function getFormAnalyticsDimensions({
	apiKey,
	formId,
	period,
}: {
	apiKey: string;
	formId: string;
	period: TallyAnalyticsPeriod;
}): Promise<TallyFormDimensionsAnalytics> {
	return makeApiCall<TallyFormDimensionsAnalytics>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/analytics/dimensions`,
		apiKey,
		queryParams: { period },
	});
}

async function getFormDropOffAnalytics({
	apiKey,
	formId,
	period,
}: {
	apiKey: string;
	formId: string;
	period: TallyAnalyticsPeriod;
}): Promise<TallyFormDropOffAnalytics> {
	return makeApiCall<TallyFormDropOffAnalytics>({
		method: HttpMethod.GET,
		path: `/forms/${formId}/analytics/drop-off`,
		apiKey,
		queryParams: { period },
	});
}

async function listWorkspaces({
	apiKey,
	page,
}: {
	apiKey: string;
	page?: number;
}): Promise<TallyListWorkspacesResponse> {
	return makeApiCall<TallyListWorkspacesResponse>({
		method: HttpMethod.GET,
		path: '/workspaces',
		apiKey,
		queryParams: { ...spreadIfDefined('page', page?.toString()) },
	});
}

async function createWorkspace({ apiKey, name }: { apiKey: string; name: string }): Promise<TallyWorkspace> {
	return makeApiCall<TallyWorkspace>({
		method: HttpMethod.POST,
		path: '/workspaces',
		apiKey,
		body: { name },
	});
}

async function getWorkspace({
	apiKey,
	workspaceId,
}: {
	apiKey: string;
	workspaceId: string;
}): Promise<TallyWorkspace> {
	return makeApiCall<TallyWorkspace>({
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}`,
		apiKey,
	});
}

async function renameWorkspace({
	apiKey,
	workspaceId,
	name,
}: {
	apiKey: string;
	workspaceId: string;
	name: string;
}): Promise<void> {
	await makeApiCall<void>({
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}`,
		apiKey,
		body: { name },
	});
}

async function deleteWorkspace({
	apiKey,
	workspaceId,
}: {
	apiKey: string;
	workspaceId: string;
}): Promise<void> {
	await makeApiCall<void>({
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}`,
		apiKey,
	});
}

async function listWorkspaceFolders({
	apiKey,
	workspaceId,
}: {
	apiKey: string;
	workspaceId: string;
}): Promise<TallyFolder[]> {
	return makeApiCall<TallyFolder[]>({
		method: HttpMethod.GET,
		path: `/workspaces/${workspaceId}/folders`,
		apiKey,
	});
}

async function createFolder({
	apiKey,
	workspaceId,
	name,
	parentId,
}: {
	apiKey: string;
	workspaceId: string;
	name: string;
	parentId?: string;
}): Promise<TallyFolder> {
	return makeApiCall<TallyFolder>({
		method: HttpMethod.POST,
		path: `/workspaces/${workspaceId}/folders`,
		apiKey,
		body: { name, ...spreadIfDefined('parentId', parentId) },
	});
}

async function renameFolder({
	apiKey,
	workspaceId,
	folderId,
	name,
}: {
	apiKey: string;
	workspaceId: string;
	folderId: string;
	name: string;
}): Promise<void> {
	await makeApiCall<void>({
		method: HttpMethod.PATCH,
		path: `/workspaces/${workspaceId}/folders/${folderId}`,
		apiKey,
		body: { name },
	});
}

async function deleteFolder({
	apiKey,
	workspaceId,
	folderId,
}: {
	apiKey: string;
	workspaceId: string;
	folderId: string;
}): Promise<void> {
	await makeApiCall<void>({
		method: HttpMethod.DELETE,
		path: `/workspaces/${workspaceId}/folders/${folderId}`,
		apiKey,
	});
}

async function getCurrentUser({ apiKey }: { apiKey: string }): Promise<TallyCurrentUser> {
	return makeApiCall<TallyCurrentUser>({
		method: HttpMethod.GET,
		path: '/users/me',
		apiKey,
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
			if (status === 403)
				throw new Error(
					responseBody?.message ?? 'Forbidden. Your API key does not have permission for this operation, or it requires a Pro subscription.',
				);
			if (status === 404) throw new Error(responseBody?.message ?? 'Not found. Check the ID and try again.');
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
