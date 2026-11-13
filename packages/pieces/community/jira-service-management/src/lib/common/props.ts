import { DropdownOption, Property, isNil } from '@activepieces/pieces-framework';
import { jsmAuth } from '../auth';
import { JiraIssue, JsmApiError, JsmAuthProps, JsmDate, jsmClient } from './client';
import { jsmRequests } from './requests';
import { jsmTransitions } from './transitions';

export const jsmProps = {
	serviceDesk,
	optionalServiceDesk,
	requestType,
	request,
	queue,
	organization,
	transition,
	resolution,
	approval,
	maxResults,
	resolveLimit,
};

function serviceDesk() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Service Desk',
		required: true,
		refreshers: [],
		options: async ({ auth }) => (auth ? serviceDeskOptions(auth.props) : disabled(CONNECT_FIRST)),
	});
}

function optionalServiceDesk({ description, advanced }: { description: string; advanced?: boolean }) {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Service Desk',
		description,
		required: false,
		advanced,
		refreshers: [],
		options: async ({ auth }) => (auth ? serviceDeskOptions(auth.props) : disabled(CONNECT_FIRST)),
	});
}

function requestType() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Request Type',
		required: true,
		refreshers: ['serviceDeskId'],
		options: async ({ auth, serviceDeskId }) => {
			const deskId = jsmClient.asString(serviceDeskId);
			if (!auth) {
				return disabled(CONNECT_FIRST);
			}
			if (isNil(deskId)) {
				return disabled('Select a service desk first');
			}
			return loadOptions(async () => {
				const types = await jsmClient.paginate<NamedItem>({
					auth: auth.props,
					path: `/servicedesk/${encodeURIComponent(deskId)}/requesttype`,
					limit: MAX_OPTIONS,
				});
				return namedOptions(types);
			});
		},
	});
}

function request() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Request',
		description: 'Type a key such as SD-123 or a word from the summary to search.',
		required: true,
		refreshers: [],
		refreshOnSearch: true,
		options: async ({ auth }, { searchValue }) => {
			if (!auth) {
				return disabled(CONNECT_FIRST);
			}
			return loadOptions(async () => {
				const issues = await searchRequestIssues({ auth: auth.props, searchValue });
				return issues.map((issue) => ({
					label: `[${issue.key}] ${issue.fields?.summary ?? ''}`.trim(),
					value: issue.key,
				}));
			});
		},
	});
}

function queue() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Queue',
		required: true,
		refreshers: ['serviceDeskId'],
		options: async ({ auth, serviceDeskId }) => {
			const deskId = jsmClient.asString(serviceDeskId);
			if (!auth) {
				return disabled(CONNECT_FIRST);
			}
			if (isNil(deskId)) {
				return disabled('Select a service desk first');
			}
			return loadOptions(async () => {
				const queues = await jsmClient.paginate<NamedItem>({
					auth: auth.props,
					path: `/servicedesk/${encodeURIComponent(deskId)}/queue`,
					limit: MAX_OPTIONS,
				});
				return namedOptions(queues);
			});
		},
	});
}

function organization() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Organization',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabled(CONNECT_FIRST);
			}
			return loadOptions(async () => {
				const organizations = await jsmClient.paginate<NamedItem>({
					auth: auth.props,
					path: '/organization',
					limit: MAX_OPTIONS,
				});
				return namedOptions(organizations);
			});
		},
	});
}

function transition() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Transition',
		description: 'The workflow step to run, for example "Resolve this issue".',
		required: true,
		refreshers: ['requestKey'],
		options: async ({ auth, requestKey }) => {
			const key = jsmClient.asString(requestKey);
			if (!auth) {
				return disabled(CONNECT_FIRST);
			}
			if (isNil(key)) {
				return disabled('Select a request first');
			}
			return loadOptions(async () => {
				const transitions = await jsmTransitions.list({ auth: auth.props, requestKey: key });
				return transitions.map((item) => ({
					label: isNil(item.to?.name) ? `${item.name ?? item.id}` : `${item.name ?? item.id} → ${item.to.name}`,
					value: item.id,
				}));
			});
		},
	});
}

function resolution() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Resolution',
		description: 'Why the request is closed. Only for transitions that resolve or cancel it.',
		required: false,
		refreshers: ['requestKey', 'transitionId'],
		options: async ({ auth, requestKey, transitionId }) => {
			const key = jsmClient.asString(requestKey);
			const chosen = jsmClient.asString(transitionId);
			if (!auth) {
				return disabled(CONNECT_FIRST);
			}
			if (isNil(key) || isNil(chosen)) {
				return disabled('Select a request and a transition first');
			}
			return loadOptions(async () => {
				const transitions = await jsmTransitions.list({ auth: auth.props, requestKey: key });
				const resolutions = jsmTransitions.resolutionsOf(jsmTransitions.find({ transitions, idOrName: chosen }));
				return resolutions.map((item) => ({ label: item.name ?? item.id, value: item.id }));
			}).then((state) =>
				!state.disabled && state.options.length === 0 ? disabled('This transition does not need a resolution') : state,
			);
		},
	});
}

function approval() {
	return Property.Dropdown({
		auth: jsmAuth,
		displayName: 'Approval',
		description: 'Empty: the pending approval of the request is answered.',
		required: false,
		advanced: true,
		refreshers: ['requestKey'],
		options: async ({ auth, requestKey }) => {
			const key = jsmClient.asString(requestKey);
			if (!auth) {
				return disabled(CONNECT_FIRST);
			}
			if (isNil(key)) {
				return disabled('Select a request first');
			}
			return loadOptions(async () => {
				const approvals = await jsmClient.paginate<ApprovalItem>({
					auth: auth.props,
					path: `/request/${encodeURIComponent(key)}/approval`,
					limit: MAX_OPTIONS,
				});
				return approvals
					.filter((item) => item.finalDecision === 'pending')
					.map((item) => ({
						label: `${item.name ?? 'Approval'} (${item.createdDate?.friendly ?? item.id})`,
						value: item.id,
					}));
			});
		},
	});
}

function maxResults() {
	return Property.Number({
		displayName: 'Max Results',
		description: 'The most requests to return.',
		required: false,
		advanced: true,
		defaultValue: DEFAULT_LIMIT,
		display: 'stepper',
		min: 1,
		max: MAX_LIMIT,
		step: 1,
	});
}

function resolveLimit(value: number | undefined): number {
	const limit = Math.floor(Number(value ?? DEFAULT_LIMIT));
	return Number.isFinite(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : DEFAULT_LIMIT;
}

async function serviceDeskOptions(auth: JsmAuthProps) {
	return loadOptions(async () => {
		const desks = await jsmRequests.listServiceDesks({ auth });
		return desks.map((desk) => ({
			label: isNil(desk.projectKey) ? `${desk.projectName ?? desk.id}` : `${desk.projectName ?? desk.projectKey} (${desk.projectKey})`,
			value: desk.id,
		}));
	});
}

async function searchRequestIssues({ auth, searchValue }: { auth: JsmAuthProps; searchValue?: string }): Promise<JiraIssue[]> {
	const desks = await jsmRequests.listServiceDesks({ auth });
	const projectIds = desks.map((desk) => desk.projectId).filter((id): id is string => !isNil(id) && /^\d+$/.test(id));
	if (projectIds.length === 0) {
		return [];
	}
	const term = (searchValue ?? '').trim();
	const scope = `project in (${projectIds.join(', ')})`;
	const filter = term.length === 0 ? '' : ` AND ${searchClause(term)}`;
	try {
		const { issues } = await jsmClient.searchIssues({
			auth,
			jql: `${scope}${filter} ORDER BY created DESC`,
			limit: REQUEST_OPTIONS,
			fields: ['summary'],
		});
		return issues;
	} catch (error) {
		if (error instanceof JsmApiError && error.status === 400 && ISSUE_KEY.test(term)) {
			return [];
		}
		throw error;
	}
}

function searchClause(term: string): string {
	return ISSUE_KEY.test(term)
		? `issuekey = ${jsmRequests.quoteJql(term.toUpperCase())}`
		: `text ~ ${jsmRequests.quoteJql(term)}`;
}

async function loadOptions(load: () => Promise<DropdownOption<string>[]>) {
	try {
		const options = await load();
		return { disabled: false, options };
	} catch (error) {
		return disabled(error instanceof Error ? error.message : 'Could not load the options. Check your connection.');
	}
}

function disabled(placeholder: string) {
	return { disabled: true, options: [], placeholder };
}

function namedOptions(items: NamedItem[]): DropdownOption<string>[] {
	return items.map((item) => ({ label: item.name ?? item.id, value: item.id }));
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CONNECT_FIRST = 'Connect your account first';
const MAX_OPTIONS = 200;
const REQUEST_OPTIONS = 50;
const ISSUE_KEY = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;

type NamedItem = {
	id: string;
	name?: string;
};

type ApprovalItem = {
	id: string;
	name?: string;
	finalDecision?: string;
	createdDate?: JsmDate;
};
