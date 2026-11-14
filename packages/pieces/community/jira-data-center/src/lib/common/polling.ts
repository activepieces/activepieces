import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Store, isNil } from '@activepieces/pieces-framework';
import { JiraDataCenterAuth } from '../../auth';
import { jiraApiCall } from './index';

const LOOKBACK_MS = 15 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const MAX_LEDGER_ENTRIES = 2000;
const TEST_FETCH_LIMIT = 50;
const TEST_ITEMS_LIMIT = 5;
const STATE_STORE_KEY = 'pollingState';
const EXPANDED_KEYS = ['changelog'];

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

		if (/^\s*order\s+by\b/i.test(jql.slice(index)) && (index === 0 || /\s/.test(char))) {
			orderByIndex = index;
		}
	}

	return (orderByIndex === -1 ? jql : jql.slice(0, orderByIndex)).trim();
}

function composeJql({
	userJql,
	since,
	direction,
	timeField,
	extraScope,
}: {
	userJql: string | undefined;
	since: string | null;
	direction: 'ASC' | 'DESC';
	timeField: JiraTimeField;
	extraScope?: JiraPollingConfig['extraScope'];
}): string {
	const scope = isNil(userJql) ? '' : stripTrailingOrderBy(userJql);
	const conditions = [
		scope.length === 0 ? null : `(${scope})`,
		extraScope ? extraScope({ since }) : null,
		isNil(since) ? null : `${timeField} > '${since}'`,
	].filter((condition): condition is string => !isNil(condition));
	const orderBy = `ORDER BY ${timeField} ${direction}`;
	return conditions.length === 0 ? orderBy : `${conditions.join(' AND ')} ${orderBy}`;
}

async function fetchIssues({
	auth,
	jql,
	limit,
	expand,
}: {
	auth: JiraDataCenterAuth;
	jql: string;
	limit: number;
	expand?: string[];
}): Promise<{ issues: JiraPolledIssue[]; truncated: boolean }> {
	const issues: JiraPolledIssue[] = [];

	for (let page = 0; page < MAX_PAGES; page++) {
		const response = await jiraApiCall<JiraSearchPage>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/search',
			body: {
				jql,
				startAt: issues.length,
				maxResults: Math.min(PAGE_SIZE, limit - issues.length),
				fields: ['*all'],
				...(isNil(expand) ? {} : { expand }),
			},
		});
		const batch = response.issues ?? [];
		issues.push(...batch);

		if (batch.length === 0 || issues.length >= (response.total ?? issues.length)) {
			return { issues, truncated: false };
		}
		if (issues.length >= limit) {
			break;
		}
	}

	return { issues, truncated: true };
}

function fieldEpoch({ issue, field }: { issue: JiraPolledIssue; field: string }): number {
	const value = issue.fields?.[field];
	return typeof value === 'string' ? Date.parse(value) : Number.NaN;
}

function toItems({
	issues,
	extractItem,
}: {
	issues: JiraPolledIssue[];
	extractItem: (params: { issue: JiraPolledIssue }) => JiraPollingItem;
}): LedgeredItem[] {
	return issues
		.map((issue) => extractItem({ issue }))
		.filter((item) => Number.isFinite(item.epochMilliSeconds))
		.map((item) => ({ ...item, key: `${item.id}:${item.epochMilliSeconds}` }))
		.sort((first, second) => first.epochMilliSeconds - second.epochMilliSeconds);
}

function truncatedWindowStart({
	issues,
	timeField,
	windowStart,
}: {
	issues: JiraPolledIssue[];
	timeField: JiraTimeField;
	windowStart: number;
}): number {
	const highestEpoch = issues.reduce((highest, issue) => {
		const epoch = fieldEpoch({ issue, field: timeField });
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
		floor: dropped.reduce((highest, [, epoch]) => Math.max(highest, epoch), Math.max(floor, windowStart)),
		entries: insideWindow.slice(overflow),
	};
}

function initialState(now: number): PollingState {
	const start = Math.floor(now / 1000) * 1000 - 1;
	return { windowStart: start, floor: start, entries: [] };
}

function latestStatusChangeEpoch(issue: JiraPolledIssue): number {
	const epochs = (issue.changelog?.histories ?? [])
		.filter((history) => (history.items ?? []).some((item) => item.field === 'status' && item.fieldtype === 'jira'))
		.map((history) => Date.parse(history.created ?? ''))
		.filter((epoch) => Number.isFinite(epoch));
	return epochs.length === 0 ? Number.NaN : Math.max(...epochs);
}

function withoutChangelog(issue: JiraPolledIssue): Record<string, unknown> {
	return Object.fromEntries(Object.entries(issue).filter(([key]) => !EXPANDED_KEYS.includes(key)));
}

export function createJiraPolling(config: JiraPollingConfig = {}) {
	const timeField = config.timeField ?? 'updated';
	const extractItem =
		config.extractItem ??
		(({ issue }: { issue: JiraPolledIssue }): JiraPollingItem => ({
			id: `${issue.id}`,
			epochMilliSeconds: fieldEpoch({ issue, field: timeField }),
			data: issue,
		}));

	return {
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

			const { issues, truncated } = await fetchIssues({
				auth,
				jql: composeJql({
					userJql: propsValue.jql,
					since: toRelativeJqlDate({ sinceEpochMS: windowStart, now }),
					direction: 'ASC',
					timeField,
					extraScope: config.extraScope,
				}),
				limit: PAGE_SIZE * MAX_PAGES,
				expand: config.expand,
			});
			const items = toItems({ issues, extractItem });

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

		async test({ context }: { context: JiraPollingContext }): Promise<unknown[]> {
			const { auth, propsValue } = context;
			const { issues } = await fetchIssues({
				auth,
				jql: composeJql({
					userJql: propsValue.jql,
					since: null,
					direction: 'DESC',
					timeField,
					extraScope: config.extraScope,
				}),
				limit: TEST_FETCH_LIMIT,
				expand: config.expand,
			});

			return toItems({ issues, extractItem })
				.slice(-TEST_ITEMS_LIMIT)
				.map((item) => item.data)
				.reverse();
		},
	};
}

export function createJiraStatusPolling() {
	return createJiraPolling({
		timeField: 'updated',
		expand: ['changelog'],
		extraScope: ({ since }) => (isNil(since) ? 'status CHANGED' : `status CHANGED AFTER '${since}'`),
		extractItem: ({ issue }) => ({
			id: `${issue.id}`,
			epochMilliSeconds: latestStatusChangeEpoch(issue),
			data: withoutChangelog(issue),
		}),
	});
}

export const jiraPollingInternals = { composeJql, stripTrailingOrderBy, toRelativeJqlDate, latestStatusChangeEpoch };

export type JiraPollingProps = { jql?: string };

export type JiraPollingItem = {
	id: string;
	epochMilliSeconds: number;
	data: Record<string, unknown>;
};

export type JiraPolledIssue = {
	id: string;
	key: string;
	fields?: Record<string, unknown>;
	changelog?: {
		histories?: Array<{
			created?: string;
			items?: Array<{ field?: string; fieldtype?: string }>;
		}>;
	};
	[key: string]: unknown;
};

type JiraSearchPage = {
	issues?: JiraPolledIssue[];
	total?: number;
};

type JiraTimeField = 'updated' | 'created';

type JiraPollingConfig = {
	timeField?: JiraTimeField;
	expand?: string[];
	extraScope?: (params: { since: string | null }) => string | null;
	extractItem?: (params: { issue: JiraPolledIssue }) => JiraPollingItem;
};

type JiraPollingContext = {
	auth: JiraDataCenterAuth;
	propsValue: JiraPollingProps;
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
