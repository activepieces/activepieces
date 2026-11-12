import { chunk, isNil, Store } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { MAX_SEARCH_PAGE_SIZE, MAX_SEARCH_TOTAL_RESULTS } from './constants';
import { FilterOperatorEnum } from './types';

const POLL_BUDGET_MS = 45_000;
const TEST_SAMPLE_SIZE = 10;
const HISTORY_BATCH_SIZE = 50;
const READ_CONCURRENCY = 4;
const EMITTED_CHANGES_LIMIT = 5_000;
const CURSOR_KEY = 'hubspotSearchCursor';
const LAST_POLL_KEY = 'lastPoll';
const OBJECT_ID_PROPERTY = 'hs_object_id';
const FUTURE_TOLERANCE_MS = 5 * 60_000;
const TIE_IDS_LIMIT = 10_000;

function createPollDeadline(budgetMs = POLL_BUDGET_MS): PollDeadline {
	const endsAt = Date.now() + budgetMs;
	return { reached: () => Date.now() >= endsAt };
}

function toEpoch(value: unknown): number {
	if (isNil(value) || value === '') {
		return NaN;
	}
	if (typeof value === 'number') {
		return value;
	}
	if (value instanceof Date) {
		return value.getTime();
	}
	const text = String(value);
	return /^\d+$/.test(text) ? Number(text) : dayjs(text).valueOf();
}

function compareIds({ a, b }: { a: string; b: string }): number {
	if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
		return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
	}
	return a.localeCompare(b);
}

async function mapInBatches<I, O>({
	items,
	batchSize,
	concurrency = READ_CONCURRENCY,
	deadline,
	read,
}: {
	items: I[];
	batchSize: number;
	concurrency?: number;
	deadline?: PollDeadline;
	read: (batch: I[]) => Promise<O>;
}): Promise<{ results: O[]; processed: number }> {
	const groups = chunk(items, batchSize * concurrency);
	let results: O[] = [];
	let processed = 0;
	for (let index = 0; index < groups.length; index++) {
		if (index > 0 && deadline?.reached()) {
			break;
		}
		const responses = await Promise.all(chunk(groups[index], batchSize).map((batch) => read(batch)));
		results = [...results, ...responses];
		processed += groups[index].length;
	}
	return { results, processed };
}

async function poll<AuthValue, PropsValue>({
	polling,
	context,
}: {
	polling: {
		items: (params: {
			auth: AuthValue;
			store: PollStore;
			propsValue: PropsValue;
			lastFetchEpochMS: number;
		}) => Promise<{ epochMilliSeconds: number; data: unknown }[]>;
	};
	context: { auth: AuthValue; store: PollStore; propsValue: PropsValue };
}): Promise<unknown[]> {
	const lastPoll = await context.store.get<number>(LAST_POLL_KEY);
	if (isNil(lastPoll)) {
		throw new Error("lastPoll doesn't exist in the store.");
	}
	const items = await polling.items({
		auth: context.auth,
		store: context.store,
		propsValue: context.propsValue,
		lastFetchEpochMS: lastPoll,
	});
	return items.map((item) => item.data);
}

async function loadCursor({ store, lastPoll }: { store: PollStore; lastPoll: number }): Promise<SearchCursor> {
	const saved = await store.get<SearchCursor>(CURSOR_KEY);
	if (isNil(saved) || saved.time !== lastPoll) {
		return { time: lastPoll, seen: [], seenAll: true };
	}
	return saved;
}

async function saveCursor({ store, cursor }: { store: PollStore; cursor: SearchCursor }): Promise<void> {
	await store.put(CURSOR_KEY, cursor);
	await store.put(LAST_POLL_KEY, cursor.time);
}

function timeFilter({ timestampProperty, cursor }: { timestampProperty: string; cursor: SearchCursor }): SearchFilter[] {
	if (!isNil(cursor.tieAfterId)) {
		return [
			{ propertyName: timestampProperty, operator: FilterOperatorEnum.Gt, value: (cursor.time - 1).toString() },
			{ propertyName: timestampProperty, operator: FilterOperatorEnum.Lt, value: (cursor.time + 1).toString() },
			{ propertyName: OBJECT_ID_PROPERTY, operator: FilterOperatorEnum.Gt, value: cursor.tieAfterId },
		];
	}
	const after = cursor.seenAll ? cursor.time : cursor.time - 1;
	return [{ propertyName: timestampProperty, operator: FilterOperatorEnum.Gt, value: after.toString() }];
}

async function readWindow<T extends CrmRecord>({
	search,
	timestampProperty,
	cursor,
	filters = [],
	properties,
	deadline,
}: {
	search: CrmSearch<T>;
	timestampProperty: string;
	cursor: SearchCursor;
	filters?: SearchFilter[];
	properties?: string[];
	deadline: PollDeadline;
}): Promise<SearchWindow<T>> {
	const keyset = !isNil(cursor.tieAfterId);
	const found: T[] = [];
	let after: string | undefined;
	let complete = false;
	for (;;) {
		const response = await search({
			limit: MAX_SEARCH_PAGE_SIZE,
			after,
			properties,
			sorts: [keyset ? OBJECT_ID_PROPERTY : timestampProperty],
			filterGroups: [{ filters: [...filters, ...timeFilter({ timestampProperty, cursor })] }],
		});
		found.push(...response.results);
		after = response.paging?.next?.after;
		if (isNil(after)) {
			complete = true;
			break;
		}
		if (parseInt(after) + MAX_SEARCH_PAGE_SIZE > MAX_SEARCH_TOTAL_RESULTS || deadline.reached()) {
			break;
		}
	}

	const seen = new Set(cursor.seen);
	const latestAccepted = Date.now() + FUTURE_TOLERANCE_MS;
	const timed = found
		.map((record) => ({ record, epoch: toEpoch(record.properties[timestampProperty]) }))
		.filter((entry) => Number.isFinite(entry.epoch));
	const fresh = timed
		.filter((entry) => entry.epoch <= latestAccepted)
		.filter((entry) => entry.epoch > cursor.time || (entry.epoch === cursor.time && !cursor.seenAll && !seen.has(entry.record.id)))
		.sort((a, b) => a.epoch - b.epoch || compareIds({ a: a.record.id, b: b.record.id }));
	if (!complete) {
		console.warn(
			`[hubspot] search on ${timestampProperty} stopped after ${found.length} records (10,000 result cap or poll deadline); the rest are read on the next poll`,
		);
	}
	const firstEpoch = timed[0]?.epoch;
	const allAtOneTime =
		!keyset &&
		!complete &&
		timed.length > 0 &&
		firstEpoch <= latestAccepted &&
		timed.every((entry) => entry.epoch === firstEpoch);
	if (allAtOneTime) {
		return { entries: [], complete: false, keysetTime: firstEpoch };
	}
	const lastFetchedId = [...found].map((record) => record.id).sort((a, b) => compareIds({ a, b })).pop();
	return { entries: fresh, complete, lastFetchedId };
}

function advanceCursor<T extends CrmRecord>({
	cursor,
	window,
	processed,
}: {
	cursor: SearchCursor;
	window: SearchWindow<T>;
	processed: TimedRecord<T>[];
}): SearchCursor {
	const base = { catchUpSince: cursor.catchUpSince, emitted: cursor.emitted };
	if (!isNil(window.keysetTime)) {
		const seen = window.keysetTime === cursor.time && !cursor.seenAll ? cursor.seen : [];
		return { ...base, time: window.keysetTime, seen, tieAfterId: '0' };
	}
	const allProcessed = processed.length === window.entries.length;
	if (!isNil(cursor.tieAfterId)) {
		if (window.complete && allProcessed) {
			return { ...base, time: cursor.time, seen: [], seenAll: true };
		}
		const lastId = allProcessed ? window.lastFetchedId : processed[processed.length - 1]?.record.id;
		return { ...base, time: cursor.time, seen: cursor.seen, tieAfterId: lastId ?? cursor.tieAfterId };
	}
	const last = processed[processed.length - 1];
	if (isNil(last)) {
		return { ...base, time: cursor.time, seen: cursor.seen, seenAll: cursor.seenAll };
	}
	const idsAtLast = processed.filter((entry) => entry.epoch === last.epoch).map((entry) => entry.record.id);
	const seen = last.epoch === cursor.time ? [...new Set([...cursor.seen, ...idsAtLast])] : idsAtLast;
	return { ...base, time: last.epoch, seen };
}

async function pollSearchTrigger<T extends CrmRecord>({
	search,
	store,
	timestampProperty,
	lastFetchEpochMS,
	properties,
	filters = [],
	testFilters = [],
}: {
	search: CrmSearch<T>;
	store: PollStore;
	timestampProperty: string;
	lastFetchEpochMS: number;
	properties?: string[];
	filters?: SearchFilter[];
	testFilters?: SearchFilter[];
}): Promise<{ epochMilliSeconds: number; data: T }[]> {
	if (lastFetchEpochMS === 0) {
		const response = await search({
			limit: TEST_SAMPLE_SIZE,
			properties,
			sorts: [`-${timestampProperty}`],
			filterGroups: testFilters.length > 0 ? [{ filters: testFilters }] : [],
		});
		return response.results
			.map((record) => ({ epochMilliSeconds: toEpoch(record.properties[timestampProperty]), data: record }))
			.sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
	}
	const cursor = await loadCursor({ store, lastPoll: lastFetchEpochMS });
	const window = await readWindow({
		search,
		timestampProperty,
		cursor,
		filters,
		properties,
		deadline: createPollDeadline(),
	});
	await saveCursor({ store, cursor: advanceCursor({ cursor, window, processed: window.entries }) });
	return window.entries.map((entry) => ({ epochMilliSeconds: entry.epoch, data: entry.record }));
}

async function pollPropertyChanges<T extends CrmRecord>({
	search,
	readWithHistory,
	store,
	timestampProperty,
	watchedProperty,
	properties,
	lastFetchEpochMS,
}: {
	search: CrmSearch<T>;
	readWithHistory: (request: HistoryReadRequest) => Promise<{ results: T[] }>;
	store: PollStore;
	timestampProperty: string;
	watchedProperty: string;
	properties: string[];
	lastFetchEpochMS: number;
}): Promise<{ epochMilliSeconds: number; data: Omit<T, 'propertiesWithHistory'> }[]> {
	if (lastFetchEpochMS === 0) {
		return pollSearchTrigger({ search, store, timestampProperty, lastFetchEpochMS, properties });
	}
	const cursor = await loadCursor({ store, lastPoll: lastFetchEpochMS });
	const changedSince = cursor.catchUpSince ?? cursor.time;
	const deadline = createPollDeadline();
	const window = await readWindow({
		search,
		timestampProperty,
		cursor,
		properties: [timestampProperty],
		deadline,
	});

	const { results, processed } = await mapInBatches({
		items: window.entries,
		batchSize: HISTORY_BATCH_SIZE,
		deadline,
		read: (batch) =>
			readWithHistory({
				properties,
				propertiesWithHistory: [watchedProperty],
				inputs: batch.map((entry) => ({ id: entry.record.id })),
			}),
	});
	if (processed < window.entries.length) {
		console.warn('[hubspot] property history reads stopped at the poll deadline; the rest are read on the next poll');
	}
	const examined = window.entries.slice(0, processed);
	const fresh = new Map(results.flatMap((response) => response.results).map((record) => [record.id, record]));
	const alreadyEmitted = new Set(cursor.emitted ?? []);

	const changes = examined.flatMap((entry) => {
		const record = fresh.get(entry.record.id);
		const history = record?.propertiesWithHistory?.[watchedProperty] ?? [];
		const changedAt = history.reduce((latest, change) => Math.max(latest, toEpoch(change.timestamp) || 0), 0);
		const key = `${entry.record.id}:${changedAt}`;
		if (!record || changedAt < changedSince || alreadyEmitted.has(key)) {
			return [];
		}
		const { propertiesWithHistory: _history, ...item } = record;
		return [{ key, item: { epochMilliSeconds: entry.epoch, data: item } }];
	});

	const advanced = advanceCursor({ cursor, window, processed: examined });
	const caughtUp = window.complete && processed === window.entries.length && isNil(advanced.tieAfterId);
	const emittedDuringCatchUp = (cursor.emitted ?? []).length + changes.length;
	if (!caughtUp && emittedDuringCatchUp > EMITTED_CHANGES_LIMIT) {
		console.warn(
			`[hubspot] catch-up has emitted more than ${EMITTED_CHANGES_LIMIT} changes; records edited again during the catch-up may fire twice`,
		);
	}
	await saveCursor({
		store,
		cursor: {
			...advanced,
			catchUpSince: caughtUp ? undefined : changedSince,
			emitted: [...(cursor.emitted ?? []), ...changes.map((change) => change.key)].slice(-EMITTED_CHANGES_LIMIT),
		},
	});
	return changes.map((change) => change.item);
}

function tieFilter({ cursor, since }: { cursor?: TieCursor; since: number }): (entry: TieEntry) => boolean {
	const active = cursor?.time === since ? cursor : undefined;
	const seen = new Set(active?.ids ?? []);
	return (entry) => {
		if (entry.time !== since || isNil(active)) {
			return entry.time > since;
		}
		if (seen.has(entry.id)) {
			return false;
		}
		if (!isNil(active.afterId)) {
			return compareIds({ a: entry.id, b: active.afterId }) > 0;
		}
		return !isNil(active.ids);
	};
}

function advanceTie({
	cursor,
	processed,
	groupComplete,
}: {
	cursor?: TieCursor;
	processed: TieEntry[];
	groupComplete: boolean;
}): TieCursor | undefined {
	const last = processed[processed.length - 1];
	if (isNil(last)) {
		return undefined;
	}
	const previous = cursor?.time === last.time ? cursor : undefined;
	if (groupComplete) {
		const carried = (previous?.ids ?? []).filter((id) => compareIds({ a: id, b: last.id }) > 0);
		return { time: last.time, afterId: last.id, ...(carried.length > 0 ? { ids: carried } : {}) };
	}
	const ids = [...new Set([...(previous?.ids ?? []), ...processed.filter((entry) => entry.time === last.time).map((entry) => entry.id)])];
	if (ids.length > TIE_IDS_LIMIT) {
		console.warn(
			`[hubspot] more than ${TIE_IDS_LIMIT} items share one timestamp and could not be read in one poll; the rest of that millisecond is skipped`,
		);
		return { time: last.time };
	}
	return { time: last.time, ...(isNil(previous?.afterId) ? {} : { afterId: previous.afterId }), ids };
}

function sampleOldestToNewest<T>({ items }: { items: T[] }): T[] {
	return [...items].reverse();
}

export const hubspotPolling = {
	sampleOldestToNewest,
	compareIds,
	tieFilter,
	advanceTie,
	createPollDeadline,
	toEpoch,
	mapInBatches,
	poll,
	pollSearchTrigger,
	pollPropertyChanges,
};

export type PollDeadline = { reached: () => boolean };

export type TieCursor = { time: number; afterId?: string; ids?: string[] };

export type TieEntry = { time: number; id: string };

export type SearchFilter = { propertyName: string; operator: FilterOperatorEnum; value?: string };

export type CrmSearchRequest = {
	limit: number;
	after?: string;
	properties?: string[];
	sorts: string[];
	filterGroups: { filters: SearchFilter[] }[];
};

type CrmRecord = {
	id: string;
	properties: Record<string, string | null>;
	propertiesWithHistory?: Record<string, { timestamp: Date | string }[]>;
};

type CrmSearch<T> = (request: CrmSearchRequest) => Promise<{ results: T[]; paging?: { next?: { after?: string } } }>;

type HistoryReadRequest = {
	properties: string[];
	propertiesWithHistory: string[];
	inputs: { id: string }[];
};

type TimedRecord<T> = { record: T; epoch: number };

type SearchWindow<T> = { entries: TimedRecord<T>[]; complete: boolean; keysetTime?: number; lastFetchedId?: string };

type SearchCursor = {
	time: number;
	seen: string[];
	seenAll?: boolean;
	tieAfterId?: string;
	catchUpSince?: number;
	emitted?: string[];
};

type PollStore = Store;
