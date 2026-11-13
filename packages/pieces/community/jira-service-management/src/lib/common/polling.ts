import { Store, isNil } from '@activepieces/pieces-framework';
import { JiraIssue, JsmAuthProps, jsmClient } from './client';
import { FlatRequest, jsmRequests } from './requests';

export const newRequestPolling = {
	onEnable,
	poll,
	test,
	selectFresh,
	advance,
	relativeJqlDate,
};

async function onEnable({ store, isRepublish }: { store: Store; isRepublish?: boolean }): Promise<void> {
	if (isRepublish && !isNil(await store.get<PollingState>(STATE_KEY))) {
		return;
	}
	await store.put<PollingState>(STATE_KEY, { windowStart: Date.now(), seen: {} });
}

async function poll({ auth, store, serviceDeskId }: PollParams): Promise<FlatRequest[]> {
	const now = Date.now();
	const state = (await store.get<PollingState>(STATE_KEY)) ?? { windowStart: now, seen: {} };
	const projectId = await projectIdOf({ auth, serviceDeskId });
	const { issues, truncated } = await jsmClient.searchIssues({
		auth,
		jql: `project = ${projectId} AND created > ${relativeJqlDate({ sinceEpochMs: state.windowStart, now })} ORDER BY created ASC`,
		limit: MAX_PER_POLL,
		fields: ISSUE_FIELDS,
	});
	const fresh = selectFresh({ issues, state });
	const requests = await jsmRequests.fetchMany({ auth, issues: fresh });
	await store.put<PollingState>(STATE_KEY, advance({ state, issues, fresh, truncated, now }));
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

function selectFresh({ issues, state }: { issues: JiraIssue[]; state: PollingState }): JiraIssue[] {
	return issues.filter((issue) => {
		const created = createdEpoch(issue);
		return Number.isFinite(created) && created > state.windowStart && isNil(state.seen[issue.id]);
	});
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
	const seen = Object.entries(emitted).reduce<Record<string, number>>(
		(acc, [id, created]) => (created > windowStart ? { ...acc, [id]: created } : acc),
		{},
	);
	return { windowStart, seen };
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
const MAX_PER_POLL = 500;
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

type AdvanceParams = {
	state: PollingState;
	issues: JiraIssue[];
	fresh: JiraIssue[];
	truncated: boolean;
	now: number;
};
