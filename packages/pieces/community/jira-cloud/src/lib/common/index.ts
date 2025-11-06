import {
	AuthenticationType,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
	httpClient,
} from '@activepieces/pieces-common';
import { JiraAuth } from '../../auth';
import { isNil } from '@activepieces/shared';

export async function sendJiraRequest(request: HttpRequest & { auth: JiraAuth }) {
	return httpClient.sendRequest({
		...request,
		url: `${request.auth.instanceUrl}/rest/api/3/${request.url}`,
		authentication: {
			type: AuthenticationType.BASIC,
			username: request.auth.email,
			password: request.auth.apiToken,
		},
	});
}

export async function getUsers(auth: JiraAuth) {
	const response = await sendJiraRequest({
		url: 'users/search',
		method: HttpMethod.GET,
		auth: auth,
		queryParams: {
			maxResults: '1000',
		},
	});

	return response.body as any[];
}

export async function getProjects(auth: JiraAuth): Promise<JiraProject[]> {

	const response = await jiraPaginatedApiCall<JiraProject,'values'>({
		auth,
		method:HttpMethod.GET,
		resourceUri:'/project/search',
		propertyName:'values'
	})

	return response;
}

export async function getIssueTypes({ auth, projectId }: { auth: JiraAuth; projectId: string }) {
	const response = await sendJiraRequest({
		url: 'issuetype/project',
		method: HttpMethod.GET,
		auth: auth,
		queryParams: {
			projectId,
		},
	});

	return response.body as any[];
}

export async function getPriorities({ auth }: { auth: JiraAuth }) {
	const response = await sendJiraRequest({
		url: 'priority',
		method: HttpMethod.GET,
		auth: auth,
	});

	return response.body as any[];
}

export async function executeJql({
	auth,
	jql,
	sanitizeJql,
	url,
	method,
	queryParams,
	body,
}: {
	auth: JiraAuth;
	jql: string;
	sanitizeJql: boolean;
	url: string;
	method: HttpMethod;
	queryParams?: QueryParams;
	body?: HttpMessageBody;
}) {
	let reqJql = jql;
	if (sanitizeJql) {
		const sanitizeResult = (
			await sendJiraRequest({
				auth: auth,
				url: 'jql/sanitize',
				method: HttpMethod.POST,
				body: {
					queries: [
						{
							query: jql,
						},
					],
				},
			})
		).body as {
			queries: {
				initialQuery: string;
				sanitizedQuery: string;
			}[];
		};
		reqJql = sanitizeResult.queries[0].sanitizedQuery;
	}

	const response = await sendJiraRequest({
		auth,
		url,
		method,
		body: {
			...body,
			jql: reqJql,
		},
		queryParams,
	});
	return response.body;
}

export async function searchIssuesByJql({
	auth,
	jql,
	maxResults,
	sanitizeJql,
}: {
	auth: JiraAuth;
	jql: string;
	maxResults: number;
	sanitizeJql: boolean;
}) {
	const respJql = (
		(await executeJql({
			auth,
			url: 'search/jql',
			method: HttpMethod.POST,
			jql,
			body: {
				maxResults,
			},
			sanitizeJql,
		})) as { issues: any[] }
	).issues;

	const issueIds = respJql.map(issue => issue['id']);
	if (issueIds.length === 0) {
		return [];
	}

	return (
    (await sendJiraRequest({
      auth,
      url: 'issue/bulkfetch',
      method: HttpMethod.POST,
      body: {
        issueIdsOrKeys: issueIds,
      },
    })).body as any as { issues: any[] }
  ).issues;
}

export async function createJiraIssue(data: CreateIssueParams) {
	const fields: any = {
		project: {
			id: data.projectId,
		},
		summary: data.summary,
		issuetype: {
			id: data.issueTypeId,
		},
	};
	if (data.assignee) fields.assignee = { id: data.assignee };
	if (data.priority) fields.priority = { id: data.priority };
	if (data.description)
		fields.description = {
			content: [
				{
					content: [
						{
							text: data.description,
							type: 'text',
						},
					],
					type: 'paragraph',
				},
			],
			type: 'doc',
			version: 1,
		};

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
	if (data.assignee) fields.assignee = { id: data.assignee };
	if (data.priority) fields.priority = { id: data.priority };
	if (data.description)
		fields.description = {
			content: [
				{
					content: [
						{
							text: data.description,
							type: 'text',
						},
					],
					type: 'paragraph',
				},
			],
			type: 'doc',
			version: 1,
		};

	if (data.parentKey) {
		fields.parent = { key: data.parentKey };
	}

	const response = await sendJiraRequest({
		url: `issue/${data.issueId}`,
		method: HttpMethod.PUT,
		auth: data.auth,
		queryParams: {
			returnIssue: 'true',
		},
		body: {
			fields: fields,
		},
	});
	return response.body;
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
	auth: JiraAuth;
	projectId: string;
	summary: string;
	description?: string;
	issueTypeId: string;
	assignee?: string;
	priority?: string;
	parentKey?: string;
}

export interface UpdateIssueParams {
	auth: JiraAuth;
	issueId?: string;
	summary?: string;
	description?: string;
	issueTypeId: string;
	assignee?: string;
	priority?: string;
	parentKey?: string;
}
export type RequestParams = Record<string, string | number | string[] | undefined>;

export type JiraApiCallParams = {
	auth:JiraAuth,
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
	const baseUrl = `${auth.instanceUrl}/rest/api/3`;
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
			type: AuthenticationType.BASIC,
			username:auth.email,
			password:auth.apiToken,
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
	const qs = query ? query : {};

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

		qs['startAt'] += 100;
		hasMore =
			response.isLast === undefined
				? response.startAt + response.maxResults < response.total
				: !response.isLast;
	} while (hasMore);

	return resultData;
}