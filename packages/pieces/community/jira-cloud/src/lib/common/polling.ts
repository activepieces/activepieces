// https://developer.atlassian.com/cloud/jira/platform/search-and-reconcile/
import { DEDUPE_KEY_PROPERTY, Store, isNil } from '@activepieces/pieces-framework';
import { JiraAuth } from '../../auth';
import { sanitizeJqlQuery, searchIssuesByJql } from './index';
import { JiraSearchResponse } from './types';

const LOOKBACK_MS = 15 * 60 * 1000;
const MAX_RESULTS = 1000;
const MAX_PAGES = 10;
const MAX_LEDGER_ENTRIES = 2000;
const TEST_ITEMS_LIMIT = 5;
const STATE_STORE_KEY = 'pollingState';

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

async function composeJql({
	auth,
	propsValue,
	since,
	direction,
}: {
	auth: JiraAuth;
	propsValue: JiraPollingContext['propsValue'];
	since: string | null;
	direction: 'ASC' | 'DESC';
}): Promise<string> {
	const userJql = isNil(propsValue.jql) ? '' : stripTrailingOrderBy(propsValue.jql);
	const scope =
		userJql.length === 0
			? null
			: `(${propsValue.sanitizeJql ? await sanitizeJqlQuery({ auth, jql: userJql }) : userJql})`;
	const conditions = [scope, isNil(since) ? null : `updated > '${since}'`].filter(
		(condition): condition is string => !isNil(condition),
	);
	const orderBy = `ORDER BY updated ${direction}`;
	return conditions.length === 0 ? orderBy : `${conditions.join(' AND ')} ${orderBy}`;
}

async function fetchIssues({
	auth,
	jql,
	maxResults,
	maxPages = 1,
}: {
	auth: JiraAuth;
	jql: string;
	maxResults: number;
	maxPages?: number;
}): Promise<{ items: PollingItem[]; truncated: boolean }> {
	const issues: JiraSearchResponse['issues'] = [];
	let nextPageToken: string | undefined;
	let truncated = false;

	for (let page = 0; page < maxPages; page++) {
		const response: JiraSearchResponse = await searchIssuesByJql({
			auth,
			jql,
			maxResults,
			sanitizeJql: false,
			nextPageToken,
		});
		issues.push(...(response.issues ?? []));
		nextPageToken = response.nextPageToken;

		if (isNil(nextPageToken)) {
			break;
		}
		if (page === maxPages - 1) {
			truncated = true;
		}
	}

	return { items: toItems(issues), truncated };
}

function toItems(issues: JiraSearchResponse['issues']): PollingItem[] {
	return issues
		.flatMap((issue) => {
			const epochMilliSeconds = Date.parse(issue?.fields?.updated);
			return Number.isFinite(epochMilliSeconds)
				? [{ key: `${issue?.id}:${epochMilliSeconds}`, epochMilliSeconds, data: issue }]
				: [];
		})
		.sort((first, second) => first.epochMilliSeconds - second.epochMilliSeconds);
}

function pruneState({
	entries,
	floor,
	windowStart,
}: {
	entries: LedgerEntry[];
	floor: number;
	windowStart: number;
}): PollingState {
	const insideWindow = entries
		.filter(([, epoch]) => epoch > windowStart)
		.sort((first, second) => first[1] - second[1]);
	const overflow = Math.max(insideWindow.length - MAX_LEDGER_ENTRIES, 0);
	const dropped = [
		...entries.filter(([, epoch]) => epoch <= windowStart),
		...insideWindow.slice(0, overflow),
	];

	return {
		windowStart,
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

export const jiraPolling = {
	async onEnable({ context }: { context: JiraPollingContext }): Promise<void> {
		const { store, isRepublish } = context;
		if (isRepublish && !isNil(await store.get<PollingState>(STATE_STORE_KEY))) {
			return;
		}
		await store.put(STATE_STORE_KEY, initialState(Date.now()));
	},

	async poll({ context }: { context: JiraPollingContext }): Promise<unknown[]> {
		const { auth, propsValue, store } = context;
		const now = Date.now();
		const state = (await store.get<PollingState>(STATE_STORE_KEY)) ?? initialState(now);
		const windowStart = Math.max(state.windowStart, state.floor);

		const { items, truncated } = await fetchIssues({
			auth,
			jql: await composeJql({
				auth,
				propsValue,
				since: toRelativeJqlDate({ sinceEpochMS: windowStart, now }),
				direction: 'ASC',
			}),
			maxResults: MAX_RESULTS,
			maxPages: MAX_PAGES,
		});

		const alreadyEmitted = new Set(state.entries.map(([key]) => key));
		const freshItems = items.filter(
			(item) => item.epochMilliSeconds > windowStart && !alreadyEmitted.has(item.key),
		);

		const highestEpoch = items.at(-1)?.epochMilliSeconds;
		const nextWindowStart = truncated
			? Math.max(windowStart, isNil(highestEpoch) ? windowStart : highestEpoch - 1)
			: Math.max(windowStart, now - LOOKBACK_MS);

		await store.put(
			STATE_STORE_KEY,
			pruneState({
				entries: [
					...state.entries,
					...freshItems.map((item): LedgerEntry => [item.key, item.epochMilliSeconds]),
				],
				floor: state.floor,
				windowStart: nextWindowStart,
			}),
		);

		return freshItems.map((item) => ({ ...item.data, [DEDUPE_KEY_PROPERTY]: item.key }));
	},

	async test({ context }: { context: JiraPollingContext }): Promise<unknown[]> {
		const { auth, propsValue } = context;
		const { items } = await fetchIssues({
			auth,
			jql: await composeJql({ auth, propsValue, since: null, direction: 'DESC' }),
			maxResults: TEST_ITEMS_LIMIT,
		});

		return items.reverse().map((item) => item.data);
	},
};

type JiraPollingContext = {
	auth: JiraAuth;
	propsValue: { jql?: string; sanitizeJql?: boolean };
	store: Store;
	isRepublish?: boolean;
};

type PollingItem = {
	key: string;
	epochMilliSeconds: number;
	data: Record<string, unknown>;
};

type LedgerEntry = [key: string, epochMilliSeconds: number];

type PollingState = {
	windowStart: number;
	floor: number;
	entries: LedgerEntry[];
};
