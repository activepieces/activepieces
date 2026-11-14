import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { JiraIssue, JsmApiError, JsmAuthProps, JsmDate, JsmUser, PagedResponse, jsmClient } from './client';
import { FlatUser, jsmUsers } from './users';

export const jsmRequests = {
	flatten,
	fromIssue,
	get,
	fetchMany,
	search,
	listServiceDesks,
	getServiceDesk,
	quoteJql,
	textClause,
	simplifyValue,
};

function flatten({ auth, request }: { auth: JsmAuthProps; request: JsmRequest }): FlatRequest {
	const fields = (request.requestFieldValues ?? []).reduce<Record<string, unknown>>((acc, item) => {
		if (isNil(item.fieldId)) {
			return acc;
		}
		return { ...acc, [item.fieldId]: simplifyValue(item.value) };
	}, {});
	const issueKey = request.issueKey ?? null;
	return {
		issue_id: request.issueId ?? null,
		issue_key: issueKey,
		summary: textOrNull(fields['summary']),
		description: textOrNull(fields['description']),
		status: request.currentStatus?.status ?? null,
		status_category: request.currentStatus?.statusCategory ?? null,
		status_changed_at: request.currentStatus?.statusDate?.iso8601 ?? null,
		request_type_id: request.requestTypeId ?? null,
		request_type_name: request.requestType?.name ?? null,
		service_desk_id: request.serviceDeskId ?? null,
		created_at: request.createdDate?.iso8601 ?? null,
		reporter_account_id: request.reporter?.accountId ?? null,
		reporter_username: jsmUsers.usernameOf(request.reporter),
		reporter_name: request.reporter?.displayName ?? null,
		reporter_email: request.reporter?.emailAddress ?? null,
		portal_url: request._links?.web ?? null,
		agent_url: agentUrl({ auth, issueKey }),
		fields,
		...(isNil(request.status)
			? {}
			: {
					status_history: (request.status.values ?? []).map((entry) => ({
						status: entry.status ?? null,
						status_category: entry.statusCategory ?? null,
						changed_at: entry.statusDate?.iso8601 ?? null,
					})),
				}),
		...(isNil(request.participants)
			? {}
			: { participants: (request.participants.values ?? []).map((user) => jsmUsers.flatten(user)) }),
		...(isNil(request.sla) ? {} : { slas: (request.sla.values ?? []).map((sla) => flattenSla(sla)) }),
	};
}

function fromIssue({ auth, issue }: { auth: JsmAuthProps; issue: JiraIssue }): FlatRequest {
	const summary = issue.fields?.summary ?? null;
	return {
		issue_id: issue.id,
		issue_key: issue.key,
		summary,
		description: null,
		status: issue.fields?.status?.name ?? null,
		status_category: issue.fields?.status?.statusCategory?.key?.toUpperCase() ?? null,
		status_changed_at: null,
		request_type_id: null,
		request_type_name: null,
		service_desk_id: null,
		created_at: issue.fields?.created ?? null,
		reporter_account_id: issue.fields?.reporter?.accountId ?? null,
		reporter_username: jsmUsers.usernameOf(issue.fields?.reporter),
		reporter_name: issue.fields?.reporter?.displayName ?? null,
		reporter_email: issue.fields?.reporter?.emailAddress ?? null,
		portal_url: null,
		agent_url: agentUrl({ auth, issueKey: issue.key }),
		fields: isNil(summary) ? {} : { summary },
	};
}

async function get({ auth, idOrKey, expand }: { auth: JsmAuthProps; idOrKey: string; expand?: string[] }): Promise<FlatRequest> {
	const request = await jsmClient.request<JsmRequest>({
		auth,
		api: 'servicedesk',
		method: HttpMethod.GET,
		path: `/request/${encodeURIComponent(idOrKey.trim())}`,
		query: { expand: ['requestType', ...(expand ?? [])].join(',') },
	});
	return flatten({ auth, request });
}

async function fetchMany({ auth, issues }: { auth: JsmAuthProps; issues: JiraIssue[] }): Promise<FlatRequest[]> {
	const results: FlatRequest[] = [];
	for (let index = 0; index < issues.length; index += FETCH_CONCURRENCY) {
		const batch = issues.slice(index, index + FETCH_CONCURRENCY);
		const fetched = await Promise.all(batch.map((issue) => getOrFallback({ auth, issue })));
		results.push(...fetched);
	}
	return results;
}

async function search({ auth, jql, limit }: { auth: JsmAuthProps; jql: string; limit: number }): Promise<FlatRequest[]> {
	const { issues } = await jsmClient.searchIssues({ auth, jql, limit, fields: SEARCH_FIELDS });
	return fetchMany({ auth, issues });
}

async function listServiceDesks({ auth }: { auth: JsmAuthProps }): Promise<ServiceDesk[]> {
	return jsmClient.paginate<ServiceDesk>({ auth, path: '/servicedesk', limit: MAX_SERVICE_DESKS });
}

async function getServiceDesk({ auth, serviceDeskId }: { auth: JsmAuthProps; serviceDeskId: string }): Promise<ServiceDesk> {
	return jsmClient.request<ServiceDesk>({
		auth,
		api: 'servicedesk',
		method: HttpMethod.GET,
		path: `/servicedesk/${encodeURIComponent(serviceDeskId)}`,
	});
}

function quoteJql(text: string): string {
	return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function textClause(term: string): string | null {
	const cleaned = term.replace(JQL_TEXT_SPECIALS, ' ').replace(/\s+/g, ' ').trim();
	return cleaned.length === 0 ? null : `text ~ ${quoteJql(cleaned)}`;
}

function simplifyValue(value: unknown): unknown {
	if (isNil(value)) {
		return null;
	}
	if (Array.isArray(value)) {
		return value.map((item) => simplifyValue(item));
	}
	if (!jsmClient.isRecord(value)) {
		return value;
	}
	const child = jsmClient.isRecord(value['child']) ? jsmClient.asString(value['child']['value']) : undefined;
	const own = LABEL_KEYS.map((key) => jsmClient.asString(value[key])).find((label) => !isNil(label));
	if (isNil(own)) {
		return JSON.stringify(value);
	}
	return isNil(child) ? own : `${own} > ${child}`;
}

async function getOrFallback({ auth, issue }: { auth: JsmAuthProps; issue: JiraIssue }): Promise<FlatRequest> {
	try {
		return await get({ auth, idOrKey: issue.id });
	} catch (error) {
		if (error instanceof JsmApiError && error.status === 404) {
			return fromIssue({ auth, issue });
		}
		throw error;
	}
}

function flattenSla(sla: JsmSla): FlatSla {
	const cycle = sla.ongoingCycle;
	return {
		id: sla.id ?? null,
		name: sla.name ?? null,
		ongoing: !isNil(cycle),
		breached: cycle?.breached ?? null,
		paused: cycle?.paused ?? null,
		started_at: cycle?.startTime?.iso8601 ?? null,
		breach_at: cycle?.breachTime?.iso8601 ?? null,
		goal: cycle?.goalDuration?.friendly ?? null,
		elapsed: cycle?.elapsedTime?.friendly ?? null,
		remaining: cycle?.remainingTime?.friendly ?? null,
		remaining_millis: cycle?.remainingTime?.millis ?? null,
		completed_cycles: (sla.completedCycles ?? []).length,
	};
}

function agentUrl({ auth, issueKey }: { auth: JsmAuthProps; issueKey: string | null }): string | null {
	return isNil(issueKey) ? null : `${jsmClient.instanceUrl(auth)}/browse/${issueKey}`;
}

function textOrNull(value: unknown): string | null {
	return typeof value === 'string' ? value : null;
}

const FETCH_CONCURRENCY = 5;
const JQL_TEXT_SPECIALS = /[+\-&|!(){}[\]^~*?\\:"]/g;
const MAX_SERVICE_DESKS = 200;
const SEARCH_FIELDS = ['summary', 'created', 'status', 'reporter'];
const LABEL_KEYS = ['name', 'value', 'displayName', 'filename', 'label', 'key', 'id'];

export type FlatRequest = {
	issue_id: string | null;
	issue_key: string | null;
	summary: string | null;
	description: string | null;
	status: string | null;
	status_category: string | null;
	status_changed_at: string | null;
	request_type_id: string | null;
	request_type_name: string | null;
	service_desk_id: string | null;
	created_at: string | null;
	reporter_account_id: string | null;
	reporter_username: string | null;
	reporter_name: string | null;
	reporter_email: string | null;
	portal_url: string | null;
	agent_url: string | null;
	fields: Record<string, unknown>;
	status_history?: { status: string | null; status_category: string | null; changed_at: string | null }[];
	participants?: FlatUser[];
	slas?: FlatSla[];
};

export type FlatSla = {
	id: string | null;
	name: string | null;
	ongoing: boolean;
	breached: boolean | null;
	paused: boolean | null;
	started_at: string | null;
	breach_at: string | null;
	goal: string | null;
	elapsed: string | null;
	remaining: string | null;
	remaining_millis: number | null;
	completed_cycles: number;
};

export type ServiceDesk = {
	id: string;
	projectId?: string;
	projectName?: string;
	projectKey?: string;
};

export type JsmRequest = {
	issueId?: string;
	issueKey?: string;
	requestTypeId?: string;
	serviceDeskId?: string;
	requestType?: { id?: string; name?: string } | null;
	createdDate?: JsmDate;
	reporter?: JsmUser | null;
	requestFieldValues?: { fieldId?: string; label?: string; value?: unknown }[];
	currentStatus?: JsmStatus;
	status?: PagedResponse<JsmStatus>;
	participants?: PagedResponse<JsmUser>;
	sla?: PagedResponse<JsmSla>;
	_links?: { web?: string; self?: string };
};

type JsmStatus = {
	status?: string;
	statusCategory?: string;
	statusDate?: JsmDate;
};

type JsmSla = {
	id?: string;
	name?: string;
	completedCycles?: unknown[];
	ongoingCycle?: {
		startTime?: JsmDate;
		breachTime?: JsmDate;
		breached?: boolean;
		paused?: boolean;
		goalDuration?: JsmDuration;
		elapsedTime?: JsmDuration;
		remainingTime?: JsmDuration;
	};
};

type JsmDuration = {
	millis?: number;
	friendly?: string;
};
