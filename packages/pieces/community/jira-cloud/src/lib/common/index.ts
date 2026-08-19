import {
	AuthenticationType,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
	httpClient,
} from '@activepieces/pieces-common';
import { JiraAuth } from '../../auth';
import { isNil, Store } from '@activepieces/pieces-framework';
import { JiraSearchResponse } from './types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Jira Cloud's /search/jql endpoint is eventually consistent, so a recently
// updated issue can be briefly missing from results, which would permanently
// break a plain checkpoint watermark (see the id+timestamp dedupe below).
// https://developer.atlassian.com/cloud/jira/platform/search-and-reconcile/
// https://github.com/activepieces/activepieces/issues/14863
const POLLING_LOOKBACK_MS = 10 * 60 * 1000;
const POLLING_MAX_PAGES = 10;

export async function sendJiraRequest(request: HttpRequest & { auth: JiraAuth }) {
	return httpClient.sendRequest({
		...request,
		url: `${request.auth.props.instanceUrl}/rest/api/3/${request.url}`,
		authentication: {
			type: AuthenticationType.BASIC,
			username: request.auth.props.email,
			password: request.auth.props.apiToken,
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
	nextPageToken,
	fields,
	expand,
}: {
	auth: JiraAuth;
	jql: string;
	maxResults: number;
	sanitizeJql: boolean;
	nextPageToken?: string;
	fields?: string[];
	expand?: string[];
}): Promise<JiraSearchResponse> {
	const bodyPayload: Record<string, any> = { maxResults };
	if (nextPageToken) bodyPayload['nextPageToken'] = nextPageToken;
	
	// Clean the array by removing any empty, null, or whitespace-only items
  	const cleanedFields = fields?.filter((f) => f && f.trim().length > 0) || [];

	if (cleanedFields.length > 0) {
		bodyPayload['fields'] = cleanedFields;
	} else {
		bodyPayload['fields'] = ['*navigable'];
	}
	
	if (expand && expand.length > 0) {
		bodyPayload['expand'] = expand.join(','); 
	}

	const searchResult = (await executeJql({
		auth,
		url: 'search/jql',
		method: HttpMethod.POST,
		jql,
		body: bodyPayload,
		sanitizeJql,
	})) as JiraSearchResponse;

	return searchResult;
}

export async function getJiraProfileTimeZone({ auth }: { auth: JiraAuth }): Promise<string> {
	const response = await sendJiraRequest({
		auth,
		url: 'myself',
		method: HttpMethod.GET,
	});
	const profile = response.body as { timeZone?: string };
	return profile.timeZone ?? 'UTC';
}

export function formatJqlDateTime({
	epochMilliSeconds,
	timeZone,
}: {
	epochMilliSeconds: number;
	timeZone: string;
}): string {
	return dayjs(epochMilliSeconds).tz(timeZone).format('YYYY-MM-DD HH:mm');
}

export function getPollingLookbackWindowStartEpochMilliSeconds(lastFetchEpochMS: number): number {
	return Math.max(0, lastFetchEpochMS - POLLING_LOOKBACK_MS);
}

export function floorToJqlMinuteEpochMilliSeconds(epochMilliSeconds: number): number {
	return Math.floor(epochMilliSeconds / 60000) * 60000;
}

export function toPollingCheckpointSafeEpochMilliSeconds({
	epochMilliSeconds,
	lastFetchEpochMS,
}: {
	epochMilliSeconds: number;
	lastFetchEpochMS: number;
}): number {
	return Math.max(epochMilliSeconds, lastFetchEpochMS + 1);
}

export async function fetchAllIssuesByJql<T>({
	auth,
	jql,
	sanitizeJql,
	fields,
	expand,
	orderByClause,
}: {
	auth: JiraAuth;
	jql: string;
	sanitizeJql: boolean;
	fields?: string[];
	expand?: string[];
	orderByClause: string;
}): Promise<T[]> {
	const allIssues: T[] = [];
	let nextPageToken: string | undefined = undefined;
	let pagesFetched = 0;

	do {
		const response = await searchIssuesByJql({
			auth,
			jql: `${jql} ${orderByClause}`,
			maxResults: 50,
			sanitizeJql,
			nextPageToken,
			fields,
			expand,
		});
		allIssues.push(...response.issues);
		nextPageToken = response.nextPageToken;
		pagesFetched += 1;
	} while (!isNil(nextPageToken) && pagesFetched < POLLING_MAX_PAGES);

	return allIssues;
}

export async function filterUnseenPollingItems<T>({
	store,
	storeKey,
	items,
	getId,
	getEpochMilliSeconds,
	pruneBeforeEpochMilliSeconds,
	suppressEmitAtOrBelowEpochMilliSeconds,
}: {
	store: Store;
	storeKey: string;
	items: T[];
	getId: (item: T) => string;
	getEpochMilliSeconds: (item: T) => number;
	pruneBeforeEpochMilliSeconds: number;
	suppressEmitAtOrBelowEpochMilliSeconds?: number;
}): Promise<T[]> {
	const existingSeenEntries = await store.get<Record<string, number>>(storeKey);
	const isFirstRunSinceUpgrade = isNil(existingSeenEntries);
	const seenEntries = existingSeenEntries ?? {};

	const unseenItems = items.filter((item) => {
		const previouslyEmittedEpochMilliSeconds = seenEntries[getId(item)];
		const isUnseen =
			isNil(previouslyEmittedEpochMilliSeconds) ||
			getEpochMilliSeconds(item) > previouslyEmittedEpochMilliSeconds;
		if (!isUnseen) {
			return false;
		}
		if (isFirstRunSinceUpgrade && !isNil(suppressEmitAtOrBelowEpochMilliSeconds)) {
			return getEpochMilliSeconds(item) > suppressEmitAtOrBelowEpochMilliSeconds;
		}
		return true;
	});

	const mergedEntries = { ...seenEntries };
	for (const item of items) {
		mergedEntries[getId(item)] = getEpochMilliSeconds(item);
	}
	const prunedEntries = Object.fromEntries(
		Object.entries(mergedEntries).filter(
			([, epochMilliSeconds]) => epochMilliSeconds >= pruneBeforeEpochMilliSeconds
		)
	);
	await store.put(storeKey, prunedEntries);

	return unseenItems;
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
	const baseUrl = `${auth.props.instanceUrl}/rest/api/3`;
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
			username:auth.props.email,
			password:auth.props.apiToken,
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

export function mapFieldNames(
  fields: Record<string, any>,
  fieldNames: Record<string, string>
) {
  const mappedFields = {} as Record<string, any>;

  for (const [fieldId, fieldValue] of Object.entries(fields)) {
    const fieldName = fieldNames?.[fieldId];
    if (fieldName) {
      mappedFields[fieldName] = fieldValue;
    } else {
      // fallback in case field cannot be mapped (but this should not happen)
      mappedFields[fieldId] = fieldValue;
    }
  }

  return mappedFields;
}
