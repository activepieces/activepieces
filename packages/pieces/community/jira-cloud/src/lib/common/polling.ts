// https://developer.atlassian.com/cloud/jira/platform/search-and-reconcile/
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Store, isNil } from '@activepieces/pieces-framework';
import { JiraAuth } from '../../auth';
import { jiraApiCall, sanitizeJqlQuery, searchIssuesByJql } from './index';
import { ChangelogHistory, JiraSearchResponse } from './types';

const LOOKBACK_MS = 15 * 60 * 1000;
const MAX_RESULTS = 1000;
const MAX_PAGES = 10;
const SEARCH_BUDGET_MS = 30_000;
const HISTORY_BUDGET_MS = 45_000;
const CHANGELOG_PAGE_SIZE = 100;
const MAX_LEDGER_ENTRIES = 2000;
const TEST_FETCH_LIMIT = 50;
const TEST_ITEMS_LIMIT = 5;
const STATE_STORE_KEY = 'pollingState';

async function jiraNow({ auth }: { auth: JiraAuth }): Promise<number> {
	const { serverTime } = await jiraApiCall<{ serverTime: string }>({
		auth,
		method: HttpMethod.GET,
		resourceUri: '/serverInfo',
	});
	const parsed = Date.parse(serverTime);
	return Number.isFinite(parsed) ? parsed : Date.now();
}

function toRelativeJqlDate({ sinceEpochMS, now }: { sinceEpochMS: number; now: number }): string {
	return `-${Math.max(Math.ceil((now - sinceEpochMS) / 60_000) + 1, 1)}m`;
}

function stripTrailingOrderBy(jql: string): string {
	let quote: '"' | "'" | null = null;
	let orderByIndex = -1;

	for (let index = 0; index < jql.length && orderByIndex === -1; index++) {
		const char = jql[index];

		if (quote) {
			if (char === '\\') {
				index += 1;
			} else if (char === quote) {
				quote = null;
			}
			continue;
		}

		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}

		if (/\s/.test(char) && /^\s+order\s+by\b/i.test(jql.slice(index))) {
			orderByIndex = index;
		}
	}

	return (orderByIndex === -1 ? jql : jql.slice(0, orderByIndex)).trim();
}

async function composeJql<Props extends JiraPollingProps>({
	auth,
	propsValue,
	since,
	eventsSince,
	direction,
	timeField,
	extraScope,
}: {
	auth: JiraAuth;
	propsValue: Props;
	since: string | null;
	eventsSince: string | null;
	direction: 'ASC' | 'DESC';
	timeField: JiraTimeField;
	extraScope?: JiraPollingConfig<Props>['extraScope'];
}): Promise<string> {
	const userJql = isNil(propsValue.jql) ? '' : stripTrailingOrderBy(propsValue.jql);
	const scope =
		userJql.length === 0
			? null
			: `(${propsValue.sanitizeJql ? await sanitizeJqlQuery({ auth, jql: userJql }) : userJql})`;
	const conditions = [
		scope,
		extraScope ? extraScope({ propsValue, since: eventsSince }) : null,
		isNil(since) ? null : `${timeField} > '${since}'`,
	].filter((condition): condition is string => !isNil(condition));
	const orderBy = `ORDER BY ${timeField} ${direction}`;
	const where = conditions.length === 0 ? `${timeField} <= now()` : conditions.join(' AND ');
	return `${where} ${orderBy}`;
}

async function fetchIssues({
	auth,
	jql,
	maxResults,
	maxPages = 1,
	fields,
	expand,
	reread,
	deadline,
}: {
	auth: JiraAuth;
	jql: string;
	maxResults: number;
	maxPages?: number;
	fields?: string[];
	expand?: string[];
	reread?: { timeField: JiraTimeField; upTo: number };
	deadline?: number;
}): Promise<{ issues: JiraSearchResponse['issues']; truncated: boolean }> {
	const issues: JiraSearchResponse['issues'] = [];
	let nextPageToken: string | undefined;
	let countedPages = 0;
	let truncated = false;

	do {
		const response: JiraSearchResponse = await searchIssuesByJql({
			auth,
			jql,
			maxResults,
			sanitizeJql: false,
			nextPageToken,
			fields,
			expand,
		});
		const pageIssues = response.issues ?? [];
		issues.push(...pageIssues);
		nextPageToken = response.nextPageToken;

		if (!isRereadPage({ pageIssues, reread })) {
			countedPages += 1;
		}
		truncated =
			!isNil(nextPageToken) &&
			(countedPages >= maxPages || (!isNil(deadline) && Date.now() >= deadline));
	} while (!isNil(nextPageToken) && !truncated);

	return { issues, truncated };
}

function isRereadPage({
	pageIssues,
	reread,
}: {
	pageIssues: JiraSearchResponse['issues'];
	reread?: { timeField: JiraTimeField; upTo: number };
}): boolean {
	return (
		!isNil(reread) &&
		pageIssues.length > 0 &&
		pageIssues.every((issue) => issueEpoch({ issue, epochField: reread.timeField }) <= reread.upTo)
	);
}

async function withCompleteChangelogs({
	auth,
	issues,
	timeField,
	windowStart,
	searchFrom,
	deadline,
}: {
	auth: JiraAuth;
	issues: JiraSearchResponse['issues'];
	timeField: JiraTimeField;
	windowStart: number;
	searchFrom: number;
	deadline: number;
}): Promise<{ issues: JiraSearchResponse['issues']; cut: boolean }> {
	const completed: JiraSearchResponse['issues'] = [];
	let passedSearchFrom = false;
	for (const issue of issues) {
		const epoch = issueEpoch({ issue, epochField: timeField });
		const changelog = incompleteChangelog({ issue, windowStart });
		if (epoch < searchFrom || isNil(changelog)) {
			completed.push(issue);
		} else if (passedSearchFrom && Date.now() >= deadline) {
			return { issues: completed, cut: true };
		} else {
			const histories = await readRecentHistories({
				auth,
				issueId: issue.id,
				total: changelog.total,
				windowStart,
			});
			completed.push({ ...issue, changelog: { ...changelog, histories, maxResults: histories.length } });
		}
		passedSearchFrom = passedSearchFrom || epoch > searchFrom;
	}
	return { issues: completed, cut: false };
}

function incompleteChangelog({
	issue,
	windowStart,
}: {
	issue: JiraSearchResponse['issues'][number];
	windowStart: number;
}): (EmbeddedChangelog & { total: number }) | null {
	const changelog: EmbeddedChangelog | undefined = issue?.changelog;
	if (isNil(changelog) || isNil(changelog.total) || changelog.total <= changelog.histories.length) {
		return null;
	}
	const oldestEmbedded = Math.min(...changelog.histories.map((history) => Date.parse(history.created)));
	return oldestEmbedded <= windowStart ? null : { ...changelog, total: changelog.total };
}

async function readRecentHistories({
	auth,
	issueId,
	total,
	windowStart,
}: {
	auth: JiraAuth;
	issueId: string;
	total: number;
	windowStart: number;
}): Promise<ChangelogHistory[]> {
	const pages: ChangelogHistory[][] = [];
	let startAt = total;
	let reachedWindowStart = false;
	while (startAt > 0 && !reachedWindowStart) {
		startAt = Math.max(startAt - CHANGELOG_PAGE_SIZE, 0);
		const page = await jiraApiCall<{ values?: ChangelogHistory[] }>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${issueId}/changelog`,
			query: { startAt, maxResults: CHANGELOG_PAGE_SIZE },
		});
		const values = page.values ?? [];
		pages.unshift(values);
		reachedWindowStart = values.length === 0 || Date.parse(values[0].created) <= windowStart;
	}
	return pages.flat();
}

function issueEpoch({
	issue,
	epochField,
}: {
	issue: JiraSearchResponse['issues'][number];
	epochField: string;
}): number {
	return Date.parse(issue?.fields?.[epochField]);
}

function toItems<Props extends JiraPollingProps>({
	issues,
	propsValue,
	extractItems,
}: {
	issues: JiraSearchResponse['issues'];
	propsValue: Props;
	extractItems: (params: {
		issue: JiraSearchResponse['issues'][number];
		propsValue: Props;
	}) => JiraPollingItem[];
}): LedgeredItem[] {
	return issues
		.flatMap((issue) => extractItems({ issue, propsValue }))
		.filter((item) => Number.isFinite(item.epochMilliSeconds))
		.map((item) => ({ ...item, key: `${item.id}:${item.epochMilliSeconds}` }))
		.sort((first, second) => first.epochMilliSeconds - second.epochMilliSeconds);
}

function lastSearchedEpoch({
	issues,
	timeField,
	searchFrom,
}: {
	issues: JiraSearchResponse['issues'];
	timeField: JiraTimeField;
	searchFrom: number;
}): number {
	const highestEpoch = issues.reduce((highest, issue) => {
		const epoch = issueEpoch({ issue, epochField: timeField });
		return Number.isFinite(epoch) ? Math.max(highest, epoch) : highest;
	}, Number.NEGATIVE_INFINITY);
	return Number.isFinite(highestEpoch) ? Math.max(searchFrom, highestEpoch) : searchFrom;
}

function pruneState({
	entries,
	floor,
	windowStart,
	searchFrom,
}: {
	entries: LedgerEntry[];
	floor: number;
	windowStart: number;
	searchFrom?: number;
}): PollingState {
	const draining = !isNil(searchFrom);
	const insideWindow = entries
		.filter(([, epoch]) => epoch > windowStart)
		.sort((first, second) => first[1] - second[1]);
	const overflow = Math.max(insideWindow.length - MAX_LEDGER_ENTRIES, 0);
	const dropped = draining
		? []
		: [...entries.filter(([, epoch]) => epoch <= windowStart), ...insideWindow.slice(0, overflow)];

	return {
		windowStart,
		searchFrom,
		floor: dropped.reduce(
			(highest, [, epoch]) => Math.max(highest, epoch),
			Math.max(floor, windowStart),
		),
		entries: insideWindow.slice(overflow),
	};
}

function initialState(now: number): PollingState {
	return { windowStart: now, floor: now, entries: [] };
}

export function createJiraPolling<Props extends JiraPollingProps = JiraPollingProps>(
	config: JiraPollingConfig<Props> = {},
) {
	const timeField = config.timeField ?? 'updated';
	const epochField = config.epochField ?? timeField;
	const fields = isNil(config.fields)
		? undefined
		: Array.from(new Set([...config.fields, timeField, epochField]));
	const extractItems =
		config.extractItems ??
		(({ issue }: { issue: JiraSearchResponse['issues'][number] }): JiraPollingItem[] => [
			{ id: `${issue?.id}`, epochMilliSeconds: issueEpoch({ issue, epochField }), data: issue },
		]);

	return {
		async onEnable({ context }: { context: JiraPollingContext<Props> }): Promise<void> {
			const { auth, store, isRepublish } = context;
			if (isRepublish && !isNil(await store.get<PollingState>(STATE_STORE_KEY))) {
				return;
			}
			await store.put(STATE_STORE_KEY, initialState(await jiraNow({ auth })));
		},

		async poll({ context }: { context: JiraPollingContext<Props> }): Promise<unknown[]> {
			const { auth, propsValue, store } = context;
			const startedAt = Date.now();
			const now = await jiraNow({ auth });
			const state = (await store.get<PollingState>(STATE_STORE_KEY)) ?? initialState(now);
			const windowStart = Math.max(state.windowStart, state.floor);
			const searchFrom = Math.max(state.searchFrom ?? windowStart, windowStart);

			const search = await fetchIssues({
				auth,
				jql: await composeJql({
					auth,
					propsValue,
					since: toRelativeJqlDate({ sinceEpochMS: searchFrom, now }),
					eventsSince: toRelativeJqlDate({ sinceEpochMS: windowStart, now }),
					direction: 'ASC',
					timeField,
					extraScope: config.extraScope,
				}),
				maxResults: MAX_RESULTS,
				maxPages: MAX_PAGES,
				fields,
				expand: config.expand,
				reread: { timeField, upTo: searchFrom },
				deadline: startedAt + SEARCH_BUDGET_MS,
			});
			const { issues, cut } = await withCompleteChangelogs({
				auth,
				issues: search.issues,
				timeField,
				windowStart,
				searchFrom,
				deadline: startedAt + HISTORY_BUDGET_MS,
			});
			const truncated = search.truncated || cut;
			const items = toItems({ issues, propsValue, extractItems });

			const alreadyEmitted = new Set(state.entries.map(([key]) => key));
			const freshItems = items.filter(
				(item) => item.epochMilliSeconds > windowStart && !alreadyEmitted.has(item.key),
			);

			const nextWindowStart = truncated ? windowStart : Math.max(windowStart, now - LOOKBACK_MS);
			const nextSearchFrom = truncated
				? lastSearchedEpoch({ issues, timeField, searchFrom })
				: undefined;

			await store.put(
				STATE_STORE_KEY,
				pruneState({
					entries: [
						...state.entries,
						...freshItems.map((item): LedgerEntry => [item.key, item.epochMilliSeconds]),
					],
					floor: state.floor,
					windowStart: nextWindowStart,
					searchFrom: nextSearchFrom,
				}),
			);

			return freshItems.map((item) => ({ ...item.data, [DEDUPE_KEY_PROPERTY]: item.key }));
		},

		async test({ context }: { context: JiraPollingContext<Props> }): Promise<unknown[]> {
			const { auth, propsValue } = context;
			const { issues } = await fetchIssues({
				auth,
				jql: await composeJql({
					auth,
					propsValue,
					since: null,
					eventsSince: null,
					direction: 'DESC',
					timeField,
					extraScope: config.extraScope,
				}),
				maxResults: TEST_FETCH_LIMIT,
				fields,
				expand: config.expand,
			});

			return toItems({ issues, propsValue, extractItems })
				.slice(-TEST_ITEMS_LIMIT)
				.map((item) => item.data)
				.reverse();
		},
	};
}

export type JiraPollingProps = { jql?: string; sanitizeJql?: boolean };

export type JiraPollingItem = {
	id: string;
	epochMilliSeconds: number;
	data: Record<string, unknown>;
};

type JiraTimeField = 'updated' | 'created';

type JiraPollingConfig<Props extends JiraPollingProps> = {
	timeField?: JiraTimeField;
	epochField?: string;
	fields?: string[];
	expand?: string[];
	extraScope?: (params: { propsValue: Props; since: string | null }) => string | null;
	extractItems?: (params: {
		issue: JiraSearchResponse['issues'][number];
		propsValue: Props;
	}) => JiraPollingItem[];
};

type JiraPollingContext<Props extends JiraPollingProps> = {
	auth: JiraAuth;
	propsValue: Props;
	store: Store;
	isRepublish?: boolean;
};

type LedgeredItem = JiraPollingItem & { key: string };

type LedgerEntry = [key: string, epochMilliSeconds: number];

type PollingState = {
	windowStart: number;
	searchFrom?: number;
	floor: number;
	entries: LedgerEntry[];
};

type EmbeddedChangelog = {
	histories: ChangelogHistory[];
	total?: number;
	maxResults?: number;
};
