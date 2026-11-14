import { Store, isNil } from '@activepieces/pieces-framework';
import { JiraIssue, JsmAuthProps, jsmClient } from './client';
import { FlatRequest, jsmRequests } from './requests';

export const newRequestPolling = {
	onEnable,
	poll,
	test,
	initialState,
	selectFresh,
	planPoll,
	advance,
	relativeJqlDate,
};

async function onEnable({ store, isRepublish }: { store: Store; isRepublish?: boolean }): Promise<void> {
	if (isRepublish && !isNil(await store.get<PollingState>(STATE_KEY))) {
		return;
	}
	await store.put<PollingState>(STATE_KEY, initialState(Date.now()));
}

async function poll({ auth, store, serviceDeskId }: PollParams): Promise<FlatRequest[]> {
	const now = Date.now();
	const state = (await store.get<PollingState>(STATE_KEY)) ?? initialState(now);
	const projectId = await projectIdOf({ auth, serviceDeskId });
	const jql = `project = ${projectId} AND created > ${relativeJqlDate({ sinceEpochMs: state.windowStart, now })} ORDER BY created ASC`;
	const first = await jsmClient.searchIssues({ auth, jql, limit: SEARCH_LIMIT, fields: ISSUE_FIELDS });
	const nothingNewInFirstPage = first.truncated && selectFresh({ issues: first.issues, state }).length === 0;
	const found = nothingNewInFirstPage
		? await jsmClient.searchIssues({ auth, jql, limit: DEEP_SEARCH_LIMIT, fields: ISSUE_FIELDS })
		: first;
	const plan = planPoll({ state, issues: found.issues, truncated: found.truncated, now });
	const requests = await jsmRequests.fetchMany({ auth, issues: plan.emit });
	await store.put<PollingState>(STATE_KEY, plan.nextState);
	return requests;
}

async function test({ auth, serviceDeskId }: { auth: JsmAuthProps; serviceDeskId: string }): Promise<FlatRequest[]> {
	const projectId = await projectIdOf({ auth, serviceDeskId });
	return jsmRequests.search({
		auth,
		jql: `project = ${projectId} ORDER BY created DESC`,
		limit: TEST_LIMIT,
	});
}

function initialState(now: number): PollingState {
	return { windowStart: Math.floor(now / 1000) * 1000 - 1, seen: {} };
}

function selectFresh({ issues, state }: { issues: JiraIssue[]; state: PollingState }): JiraIssue[] {
	return issues.filter((issue) => {
		const created = createdEpoch(issue);
		return Number.isFinite(created) && created > state.windowStart && isNil(state.seen[issue.id]);
	});
}

function planPoll({ state, issues, truncated, now }: PlanParams): PollPlan {
	const candidates = selectFresh({ issues, state });
	const emit = candidates.slice(0, MAX_EMIT_PER_POLL);
	const limited = candidates.length > emit.length;
	if (truncated && candidates.length === 0) {
		const windowStart = Math.min(now, state.windowStart + STALL_STEP_MS);
		return { emit, nextState: { windowStart, seen: keepSeen({ seen: state.seen, windowStart }) } };
	}
	return {
		emit,
		nextState: advance({ state, issues: limited ? emit : issues, fresh: emit, truncated: truncated || limited, now }),
	};
}

function advance({ state, issues, fresh, truncated, now }: AdvanceParams): PollingState {
	const newestFetched = issues.reduce((newest, issue) => {
		const created = createdEpoch(issue);
		return Number.isFinite(created) ? Math.max(newest, created) : newest;
	}, state.windowStart);
	const windowStart = truncated
		? Math.max(state.windowStart, newestFetched - 1)
		: Math.max(state.windowStart, now - LOOKBACK_MS);
	const emitted = fresh.reduce<Record<string, number>>(
		(acc, issue) => ({ ...acc, [issue.id]: createdEpoch(issue) }),
		state.seen,
	);
	return { windowStart, seen: keepSeen({ seen: emitted, windowStart }) };
}

function keepSeen({ seen, windowStart }: { seen: Record<string, number>; windowStart: number }): Record<string, number> {
	return Object.entries(seen).reduce<Record<string, number>>(
		(acc, [id, created]) => (created > windowStart ? { ...acc, [id]: created } : acc),
		{},
	);
}

function relativeJqlDate({ sinceEpochMs, now }: { sinceEpochMs: number; now: number }): string {
	const minutes = Math.max(Math.ceil((now - sinceEpochMs) / 60_000) + 1, 1);
	return `"-${minutes}m"`;
}

async function projectIdOf({ auth, serviceDeskId }: { auth: JsmAuthProps; serviceDeskId: string }): Promise<string> {
	const desk = await jsmRequests.getServiceDesk({ auth, serviceDeskId });
	if (isNil(desk.projectId) || !/^\d+$/.test(desk.projectId)) {
		throw new Error(`Service desk ${serviceDeskId} has no Jira project. Pick the service desk again in the trigger settings.`);
	}
	return desk.projectId;
}

function createdEpoch(issue: JiraIssue): number {
	return Date.parse(issue.fields?.created ?? '');
}

const STATE_KEY = 'newRequestState';
const LOOKBACK_MS = 15 * 60 * 1000;
const SEARCH_LIMIT = 500;
const DEEP_SEARCH_LIMIT = 5000;
const MAX_EMIT_PER_POLL = 200;
const STALL_STEP_MS = 60 * 1000;
const TEST_LIMIT = 5;
const ISSUE_FIELDS = ['summary', 'created', 'status', 'reporter'];

export type PollingState = {
	windowStart: number;
	seen: Record<string, number>;
};

type PollParams = {
	auth: JsmAuthProps;
	store: Store;
	serviceDeskId: string;
};

type PlanParams = {
	state: PollingState;
	issues: JiraIssue[];
	truncated: boolean;
	now: number;
};

type PollPlan = {
	emit: JiraIssue[];
	nextState: PollingState;
};

type AdvanceParams = {
	state: PollingState;
	issues: JiraIssue[];
	fresh: JiraIssue[];
	truncated: boolean;
	now: number;
};
