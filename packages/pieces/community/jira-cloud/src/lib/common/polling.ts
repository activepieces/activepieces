// https://developer.atlassian.com/cloud/jira/platform/search-and-reconcile/
import { DEDUPE_KEY_PROPERTY, Store, isNil } from '@activepieces/pieces-framework';
import { JiraAuth } from '../../auth';
import { sanitizeJqlQuery, searchIssuesByJql } from './index';
import { JiraSearchResponse } from './types';

const LOOKBACK_MS = 15 * 60 * 1000;
const MAX_RESULTS = 1000;
const MAX_PAGES = 10;
const MAX_LEDGER_ENTRIES = 2000;
const TEST_FETCH_LIMIT = 50;
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

async function composeJql<Props extends JiraPollingProps>({
	auth,
	propsValue,
	since,
	direction,
	timeField,
	extraScope,
}: {
	auth: JiraAuth;
	propsValue: Props;
	since: string | null;
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
		extraScope ? extraScope({ propsValue, since }) : null,
		isNil(since) ? null : `${timeField} > '${since}'`,
	].filter((condition): condition is string => !isNil(condition));
	const orderBy = `ORDER BY ${timeField} ${direction}`;
	return conditions.length === 0 ? orderBy : `${conditions.join(' AND ')} ${orderBy}`;
}

async function fetchIssues({
	auth,
	jql,
	maxResults,
	maxPages = 1,
	fields,
	expand,
}: {
	auth: JiraAuth;
	jql: string;
	maxResults: number;
	maxPages?: number;
	fields?: string[];
	expand?: string[];
}): Promise<{ issues: JiraSearchResponse['issues']; truncated: boolean }> {
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
			fields,
			expand,
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

	return { issues, truncated };
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

function truncatedWindowStart({
	issues,
	timeField,
	windowStart,
}: {
	issues: JiraSearchResponse['issues'];
	timeField: JiraTimeField;
	windowStart: number;
}): number {
	const highestEpoch = issues.reduce((highest, issue) => {
		const epoch = issueEpoch({ issue, epochField: timeField });
		return Number.isFinite(epoch) ? Math.max(highest, epoch) : highest;
	}, Number.NEGATIVE_INFINITY);
	return Number.isFinite(highestEpoch) ? Math.max(windowStart, highestEpoch - 1) : windowStart;
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
			const { store, isRepublish } = context;
			if (isRepublish && !isNil(await store.get<PollingState>(STATE_STORE_KEY))) {
				return;
			}
			await store.put(STATE_STORE_KEY, initialState(Date.now()));
		},

		async poll({ context }: { context: JiraPollingContext<Props> }): Promise<unknown[]> {
			const { auth, propsValue, store } = context;
			const now = Date.now();
			const state = (await store.get<PollingState>(STATE_STORE_KEY)) ?? initialState(now);
			const windowStart = Math.max(state.windowStart, state.floor);

			const { issues, truncated } = await fetchIssues({
				auth,
				jql: await composeJql({
					auth,
					propsValue,
					since: toRelativeJqlDate({ sinceEpochMS: windowStart, now }),
					direction: 'ASC',
					timeField,
					extraScope: config.extraScope,
				}),
				maxResults: MAX_RESULTS,
				maxPages: MAX_PAGES,
				fields,
				expand: config.expand,
			});
			const items = toItems({ issues, propsValue, extractItems });

			const alreadyEmitted = new Set(state.entries.map(([key]) => key));
			const freshItems = items.filter(
				(item) => item.epochMilliSeconds > windowStart && !alreadyEmitted.has(item.key),
			);

			const nextWindowStart = truncated
				? truncatedWindowStart({ issues, timeField, windowStart })
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

		async test({ context }: { context: JiraPollingContext<Props> }): Promise<unknown[]> {
			const { auth, propsValue } = context;
			const { issues } = await fetchIssues({
				auth,
				jql: await composeJql({
					auth,
					propsValue,
					since: null,
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
	floor: number;
	entries: LedgerEntry[];
};
