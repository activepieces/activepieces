import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';

export class JsmApiError extends Error {
	readonly status: number;

	constructor({ status, message }: { status: number; message: string }) {
		super(message);
		this.name = 'JsmApiError';
		this.status = status;
	}
}

export const jsmClient = {
	isCloud,
	instanceUrl,
	authHeaders,
	request,
	paginate,
	searchIssues,
	isRecord,
	asString,
};

export const JSM_DEPLOYMENT = {
	CLOUD: 'cloud',
	DATA_CENTER: 'data_center',
};

function isCloud(auth: JsmAuthProps): boolean {
	return auth.deployment !== JSM_DEPLOYMENT.DATA_CENTER;
}

function instanceUrl(auth: JsmAuthProps): string {
	const trimmed = auth.instanceUrl.trim().replace(/\/+$/, '');
	if (!isCloud(auth)) {
		return trimmed;
	}
	try {
		return new URL(trimmed).origin;
	} catch {
		return trimmed;
	}
}

function authHeaders(auth: JsmAuthProps): Record<string, string> {
	if (isCloud(auth)) {
		const credentials = Buffer.from(`${auth.email ?? ''}:${auth.apiToken}`).toString('base64');
		return { Authorization: `Basic ${credentials}` };
	}
	return { Authorization: `Bearer ${auth.apiToken}` };
}

async function request<T>({ auth, api, method, path, query, body, experimental }: RequestParams): Promise<T> {
	try {
		const response = await httpClient.sendRequest<T>({
			method,
			url: `${instanceUrl(auth)}${apiRoot({ auth, api })}${path}`,
			headers: {
				...authHeaders(auth),
				Accept: 'application/json',
				...(experimental ? { 'X-ExperimentalApi': 'opt-in' } : {}),
			},
			queryParams: cleanQuery(query),
			body,
		});
		return response.body;
	} catch (error) {
		if (error instanceof HttpError) {
			throw new JsmApiError({
				status: error.response.status,
				message: describeFailure({ status: error.response.status, body: error.response.body }),
			});
		}
		throw error;
	}
}

async function paginate<T>({ auth, path, query, limit, experimental }: PaginateParams): Promise<T[]> {
	const collected: T[] = [];
	for (let page = 0; page < MAX_PAGES && collected.length < limit; page++) {
		const response = await request<PagedResponse<T>>({
			auth,
			api: 'servicedesk',
			method: HttpMethod.GET,
			path,
			query: {
				...query,
				start: String(collected.length),
				limit: String(Math.min(PAGE_SIZE, limit - collected.length)),
			},
			experimental,
		});
		const values = response.values ?? [];
		collected.push(...values);
		if (response.isLastPage !== false || values.length === 0) {
			break;
		}
	}
	return collected.slice(0, limit);
}

async function searchIssues({ auth, jql, limit, fields }: SearchParams): Promise<SearchResult> {
	return isCloud(auth)
		? searchCloud({ auth, jql, limit, fields })
		: searchDataCenter({ auth, jql, limit, fields });
}

async function searchCloud({ auth, jql, limit, fields }: SearchParams): Promise<SearchResult> {
	const issues: JiraIssue[] = [];
	let nextPageToken: string | undefined = undefined;
	for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
		const response: CloudSearchResponse = await request<CloudSearchResponse>({
			auth,
			api: 'jira',
			method: HttpMethod.POST,
			path: '/search/jql',
			body: {
				jql,
				fields,
				maxResults: Math.min(PAGE_SIZE, limit - issues.length),
				...(isNil(nextPageToken) ? {} : { nextPageToken }),
			},
		});
		issues.push(...(response.issues ?? []));
		nextPageToken = response.nextPageToken ?? undefined;
		if (isNil(nextPageToken)) {
			return { issues, truncated: false };
		}
		if (issues.length >= limit) {
			break;
		}
	}
	return { issues: issues.slice(0, limit), truncated: true };
}

async function searchDataCenter({ auth, jql, limit, fields }: SearchParams): Promise<SearchResult> {
	const issues: JiraIssue[] = [];
	for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
		const response = await request<DataCenterSearchResponse>({
			auth,
			api: 'jira',
			method: HttpMethod.POST,
			path: '/search',
			body: {
				jql,
				fields,
				startAt: issues.length,
				maxResults: Math.min(PAGE_SIZE, limit - issues.length),
			},
		});
		const batch = response.issues ?? [];
		issues.push(...batch);
		const total = response.total ?? issues.length;
		if (batch.length === 0 || issues.length >= total) {
			return { issues, truncated: false };
		}
		if (issues.length >= limit) {
			break;
		}
	}
	return { issues: issues.slice(0, limit), truncated: true };
}

function apiRoot({ auth, api }: { auth: JsmAuthProps; api: JsmApi }): string {
	if (api === 'servicedesk') {
		return '/rest/servicedeskapi';
	}
	return isCloud(auth) ? '/rest/api/3' : '/rest/api/2';
}

function cleanQuery(query: Record<string, string | undefined> | undefined): Record<string, string> | undefined {
	if (isNil(query)) {
		return undefined;
	}
	return Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
		if (isNil(value) || value === '') {
			return acc;
		}
		return { ...acc, [key]: value };
	}, {});
}

function describeFailure({ status, body }: { status: number; body: unknown }): string {
	const detail = vendorMessage(body);
	const hint = STATUS_HINTS[status];
	const parts = [`Jira Service Management returned an error (${status})`, detail, hint].filter(
		(part): part is string => !isNil(part) && part.length > 0,
	);
	return parts.join('. ').replace(/\.\./g, '.');
}

function vendorMessage(body: unknown): string | undefined {
	if (typeof body === 'string') {
		return body.trim().startsWith('<') ? undefined : body.trim().slice(0, 500);
	}
	if (!isRecord(body)) {
		return undefined;
	}
	const single = asString(body['errorMessage']) ?? asString(body['message']);
	if (!isNil(single)) {
		return MESSAGE_KEY.test(single) ? undefined : single;
	}
	const listed = Array.isArray(body['errorMessages'])
		? body['errorMessages'].filter((item): item is string => typeof item === 'string')
		: [];
	const perField = isRecord(body['errors'])
		? Object.entries(body['errors']).map(([field, message]) => `${field}: ${String(message)}`)
		: [];
	const combined = [...listed, ...perField].join(' ');
	return combined.length > 0 ? combined : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim().length > 0) {
		return value.trim();
	}
	if (typeof value === 'number') {
		return String(value);
	}
	return undefined;
}

const PAGE_SIZE = 50;
const MESSAGE_KEY = /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i;
const MAX_PAGES = 20;
const MAX_SEARCH_PAGES = 100;
const STATUS_HINTS: Record<number, string> = {
	401: 'Check the Instance URL, email and token in your connection',
	403: 'The connected account is not allowed to do this. Check its permissions in Jira',
	404: 'Check that the request, service desk or other item exists and that the connected account can see it',
	429: 'Jira is rate limiting the connected account. Wait a minute and try again',
};

export type JsmAuthProps = {
	deployment: string;
	instanceUrl: string;
	email?: string;
	apiToken: string;
};

export type JsmApi = 'servicedesk' | 'jira';

export type JiraIssue = {
	id: string;
	key: string;
	fields?: {
		summary?: string | null;
		created?: string | null;
		status?: { name?: string; statusCategory?: { key?: string } } | null;
		reporter?: JsmUser | null;
	};
};

export type JsmUser = {
	accountId?: string;
	name?: string;
	key?: string;
	emailAddress?: string;
	displayName?: string;
	active?: boolean;
	timeZone?: string;
};

export type JsmDate = {
	iso8601?: string;
	jira?: string;
	friendly?: string;
	epochMillis?: number;
};

export type PagedResponse<T> = {
	values?: T[];
	isLastPage?: boolean;
	size?: number;
	start?: number;
	limit?: number;
};

export type SearchResult = {
	issues: JiraIssue[];
	truncated: boolean;
};

type RequestParams = {
	auth: JsmAuthProps;
	api: JsmApi;
	method: HttpMethod;
	path: string;
	query?: Record<string, string | undefined>;
	body?: unknown;
	experimental?: boolean;
};

type PaginateParams = {
	auth: JsmAuthProps;
	path: string;
	query?: Record<string, string | undefined>;
	limit: number;
	experimental?: boolean;
};

type SearchParams = {
	auth: JsmAuthProps;
	jql: string;
	limit: number;
	fields: string[];
};

type CloudSearchResponse = {
	issues?: JiraIssue[];
	nextPageToken?: string | null;
};

type DataCenterSearchResponse = {
	issues?: JiraIssue[];
	total?: number;
};
