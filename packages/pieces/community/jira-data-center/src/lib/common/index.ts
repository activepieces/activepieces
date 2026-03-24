import {
	AuthenticationType,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
	httpClient,
} from '@activepieces/pieces-common';
import { JiraDataCenterAuth } from '../../auth';
import { isNil } from '@activepieces/shared';

export async function sendJiraRequest(request: HttpRequest & { auth: JiraDataCenterAuth }) {
	return httpClient.sendRequest({
		...request,
		url: `${request.auth.props.instanceUrl}/rest/api/2/${request.url}`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: request.auth.props.personalAccessToken,
		},
	});
}

export async function getUsers(auth: JiraDataCenterAuth) {
	const response = await sendJiraRequest({
		url: 'user/search',
		method: HttpMethod.GET,
		auth: auth,
		queryParams: {
			maxResults: '1000',
			username: '.',
		},
	});

	return response.body as any[];
}

export async function getProjects(auth: JiraDataCenterAuth): Promise<JiraProject[]> {
	const response = await jiraApiCall<JiraProject[]>({
		auth,
		method: HttpMethod.GET,
		resourceUri: '/project',
	});

	return response;
}

export async function getIssueTypes({
	auth,
	projectId,
}: {
	auth: JiraDataCenterAuth;
	projectId: string;
}) {
	return await jiraPaginatedApiCall<{ id: string; name: string }, 'values'>({
		auth,
		method: HttpMethod.GET,
		resourceUri: `/issue/createmeta/${projectId}/issuetypes`,
		propertyName: 'values',
	});
}

export async function getPriorities({ auth }: { auth: JiraDataCenterAuth }) {
	const response = await sendJiraRequest({
		url: 'priority',
		method: HttpMethod.GET,
		auth: auth,
	});

	return response.body as any[];
}

export async function searchIssuesByJql({
	auth,
	jql,
	maxResults,
}: {
	auth: JiraDataCenterAuth;
	jql: string;
	maxResults: number;
}) {
	const response = await sendJiraRequest({
		auth,
		url: 'search',
		method: HttpMethod.POST,
		body: {
			jql,
			maxResults,
			fields: ['*all'],
		},
	});

	return ((response.body as any)?.issues as any[]) ?? [];
}

export async function createJiraIssue(data: CreateIssueParams) {
	const fields: any = {
		project: {
			key: data.projectId,
		},
		summary: data.summary,
		issuetype: {
			id: data.issueTypeId,
		},
	};
	if (data.assignee) fields.assignee = { name: data.assignee };
	if (data.priority) fields.priority = { id: data.priority };
	if (data.description) fields.description = data.description;

	if (data.parentKey) {
		fields.parent = { key: data.parentKey };
	}

	const response = await sendJiraRequest({
		url: 'issue',
		method: HttpMethod.POST,
		auth: data.auth,
		body: {
			fields: fields,
		},
	});
	return response.body;
}

export async function updateJiraIssue(data: UpdateIssueParams) {
	const fields: any = {};
	if (data.summary) fields.summary = data.summary;
	if (data.issueTypeId) fields.issuetype = { id: data.issueTypeId };
	if (data.assignee) fields.assignee = { name: data.assignee };
	if (data.priority) fields.priority = { id: data.priority };
	if (data.description) fields.description = data.description;

	if (data.parentKey) {
		fields.parent = { key: data.parentKey };
	}

	const response = await sendJiraRequest({
		url: `issue/${data.issueId}`,
		method: HttpMethod.PUT,
		auth: data.auth,
		body: {
			fields: fields,
		},
	});
	return response.body;
}

export type RequestParams = Record<string, string | number | string[] | undefined>;

export type JiraApiCallParams = {
	auth: JiraDataCenterAuth;
	method: HttpMethod;
	resourceUri: string;
	query?: RequestParams;
	body?: any;
};

export async function jiraApiCall<T extends HttpMessageBody>({
	auth,
	method,
	resourceUri,
	query,
	body,
}: JiraApiCallParams): Promise<T> {
	const baseUrl = `${auth.props.instanceUrl}/rest/api/2`;
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
		url: baseUrl + resourceUri,
		queryParams: qs,
		body,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.props.personalAccessToken,
		},
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export async function jiraPaginatedApiCall<T extends HttpMessageBody, K extends string>({
	auth,
	method,
	resourceUri,
	query,
	body,
	propertyName,
}: JiraApiCallParams & { propertyName: K }): Promise<T[]> {
	const qs = query ? { ...query } : {};

	qs['startAt'] = 0;
	qs['maxResults'] = 100;

	const resultData: T[] = [];
	let hasMore = true;

	type PaginatedResponse<T, K extends string> = {
		startAt: number;
		maxResults: number;
		total: number;
		isLast?: boolean;
	} & Record<K, T[]>;

	do {
		const response = await jiraApiCall<PaginatedResponse<T, K>>({
			auth,
			method,
			resourceUri,
			query: qs,
			body,
		});

		if (isNil(response[propertyName])) {
			break;
		}

		if (Array.isArray(response[propertyName])) {
			resultData.push(...response[propertyName]);
		}

		qs['startAt'] = (qs['startAt'] as number) + 100;
		hasMore =
			response.isLast === undefined
				? response.startAt + response.maxResults < response.total
				: !response.isLast;
	} while (hasMore);

	return resultData;
}

export interface JiraIssueType {
	id: string;
	description: string;
	name: string;
}

export interface JiraProject {
	id: string;
	key: string;
	name: string;
	expand: string;
	self: string;
	projectTypeKey: string;
	simplified: boolean;
	style: string;
	isPrivate: boolean;
	properties: any;
}

export interface CreateIssueParams {
	auth: JiraDataCenterAuth;
	projectId: string;
	summary: string;
	description?: string;
	issueTypeId: string;
	assignee?: string;
	priority?: string;
	parentKey?: string;
}

export interface UpdateIssueParams {
	auth: JiraDataCenterAuth;
	issueId?: string;
	summary?: string;
	description?: string;
	issueTypeId: string;
	assignee?: string;
	priority?: string;
	parentKey?: string;
}
