import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createMockPollingTriggerContext,
	InputPropertyMap,
	Store,
} from '@activepieces/pieces-framework';
import { teableClient, TeableRecord } from '../src/lib/common/client';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { updatedRecordTrigger } from '../src/lib/triggers/updated-record';
import { PAT_AUTH } from './helpers';

const BASE_EPOCH = Date.parse('2026-10-01T00:00:00.000Z');

const LAST_MODIFIED_FIELD = {
	id: 'fldLM',
	name: 'LastModified',
	type: 'lastModifiedTime',
	options: { formatting: { date: 'YYYY-MM-DD', time: 'HH:mm', timeZone: 'UTC' } },
};

function iso(epoch: number): string {
	return new Date(epoch).toISOString();
}

function makeRecords(count: number): TeableRecord[] {
	return Array.from({ length: count }, (_, index) => {
		const epoch = BASE_EPOCH + index * 1000;
		return {
			id: `rec${index}`,
			fields: { LastModified: iso(epoch) },
			createdTime: iso(epoch),
			lastModifiedTime: iso(epoch),
			autoNumber: index + 1,
		};
	});
}

function memoryStore(initial: Record<string, unknown>): Store {
	const data = new Map<string, unknown>(Object.entries(initial));
	return {
		put: async (key, value) => {
			data.set(key, value);
			return value;
		},
		get: async (key) => {
			const value = data.has(key) ? data.get(key) : null;
			return value as never;
		},
		delete: async (key) => {
			data.delete(key);
		},
	};
}

function pollContext({ store }: { store: Store }) {
	const base = createMockPollingTriggerContext<InputPropertyMap>({
		propsValue: { base_id: 'bse1', table_id: 'tbl1' },
	});
	return { ...base, auth: PAT_AUTH, store };
}

function mockListRecords(
	records: TeableRecord[] | (() => TeableRecord[]),
	beforeCall?: (query: Record<string, unknown> | undefined) => void
) {
	return vi
		.spyOn(teableClient, 'listRecords')
		.mockImplementation(async ({ query }) => {
			beforeCall?.(query);
			const stored = typeof records === 'function' ? records() : records;
			let rows = [...stored].sort((a, b) => (a.autoNumber ?? 0) - (b.autoNumber ?? 0));
			const orderBy = query?.['orderBy'];
			if (typeof orderBy === 'string') {
				const [{ order }] = JSON.parse(orderBy) as { order: 'asc' | 'desc' }[];
				rows.sort(
					(a, b) =>
						Date.parse(a.lastModifiedTime ?? '') - Date.parse(b.lastModifiedTime ?? '')
				);
				if (order === 'desc') {
					rows.reverse();
				}
			}
			const selected = query?.['selectedRecordIds'];
			if (Array.isArray(selected)) {
				rows = rows.filter((row) => selected.includes(row.id));
			}
			const skip = typeof query?.['skip'] === 'number' ? query['skip'] : 0;
			const take = typeof query?.['take'] === 'number' ? query['take'] : rows.length;
			return { records: rows.slice(skip, skip + take) };
		});
}

type DeliveredRecord = { id: string };

type FrontierSnapshot = {
	epoch: number;
	ids: string[];
	autoNumber?: number;
	pending?: { expectedLastPoll: number; ids: string[]; autoNumber?: number };
};

function failingPutStore({
	inner,
	failures,
}: {
	inner: Store;
	failures: Map<string, 'reject' | 'write-then-reject'>;
}): Store {
	return {
		put: async (key, value) => {
			const mode = failures.get(key);
			if (mode !== undefined) {
				failures.delete(key);
				if (mode === 'reject') {
					throw new Error(`simulated put failure for ${key}`);
				}
				await inner.put(key, value);
				throw new Error(`simulated crash after writing ${key}`);
			}
			return inner.put(key, value);
		},
		get: (key) => inner.get(key),
		delete: (key) => inner.delete(key),
	};
}

async function runPoll(trigger: {
	run(context: ReturnType<typeof pollContext>): Promise<unknown[]>;
}, store: Store): Promise<DeliveredRecord[]> {
	const delivered = await trigger.run(pollContext({ store }));
	return delivered as DeliveredRecord[];
}

beforeEach(() => {
	vi.restoreAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

function makeTieRecords({
	count,
	epoch,
	startIndex = 0,
}: {
	count: number;
	epoch: number;
	startIndex?: number;
}): TeableRecord[] {
	return Array.from({ length: count }, (_, offset) => {
		const index = startIndex + offset;
		return {
			id: `rec${index}`,
			fields: { LastModified: iso(epoch) },
			createdTime: iso(epoch),
			lastModifiedTime: iso(epoch),
			autoNumber: index + 1,
		};
	});
}

describe('same-timestamp group larger than the poll cap', () => {
	const TIE_EPOCH = BASE_EPOCH + 10_000;

	it('new record trigger resumes inside the group across polls and loses nothing', async () => {
		const records = makeTieRecords({ count: 12500, epoch: TIE_EPOCH });
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		mockListRecords(records);
		const store = memoryStore({ lastPoll: BASE_EPOCH });

		const poll1 = await runPoll(newRecordTrigger, store);
		const frontier1 = await store.get<FrontierSnapshot>('teable_new_record_frontier');
		expect(frontier1?.epoch).toBe(TIE_EPOCH);
		expect(frontier1?.ids).toHaveLength(0);
		expect(frontier1?.pending?.ids).toHaveLength(poll1.length);
		expect(frontier1?.pending?.expectedLastPoll).toBe(BASE_EPOCH + 1);

		const poll2 = await runPoll(newRecordTrigger, store);
		const frontier2 = await store.get<FrontierSnapshot>('teable_new_record_frontier');
		expect(frontier2?.ids).toHaveLength(poll1.length);
		expect(frontier2?.pending?.ids).toHaveLength(poll2.length);

		const poll3 = await runPoll(newRecordTrigger, store);
		expect(await store.get('teable_new_record_frontier')).toBeNull();

		const ids = [...poll1, ...poll2, ...poll3].map((record) => record.id);
		expect(ids.length).toBe(12500);
		expect(new Set(ids).size).toBe(12500);
		expect(await runPoll(newRecordTrigger, store)).toEqual([]);
	});

	it('updated record trigger fires newer records only after the group completes', async () => {
		const group = makeTieRecords({ count: 12500, epoch: TIE_EPOCH });
		const newer = Array.from({ length: 100 }, (_, offset) => {
			const epoch = TIE_EPOCH + (offset + 1) * 1000;
			return {
				id: `newer${offset}`,
				fields: { LastModified: iso(epoch) },
				createdTime: iso(epoch),
				lastModifiedTime: iso(epoch),
			};
		});
		const records = [...group, ...newer];
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([
			LAST_MODIFIED_FIELD,
		]);
		mockListRecords(records);
		const store = memoryStore({ lastPoll: BASE_EPOCH });

		const poll1 = await runPoll(updatedRecordTrigger, store);
		const poll2 = await runPoll(updatedRecordTrigger, store);
		expect([...poll1, ...poll2].some((record) => record.id.startsWith('newer'))).toBe(false);
		expect(
			(await store.get<{ epoch: number }>('teable_updated_record_frontier'))?.epoch
		).toBe(TIE_EPOCH);

		const poll3 = await runPoll(updatedRecordTrigger, store);
		expect(poll3.filter((record) => record.id.startsWith('newer'))).toHaveLength(100);
		expect(await store.get('teable_updated_record_frontier')).toBeNull();

		const ids = [...poll1, ...poll2, ...poll3].map((record) => record.id);
		expect(ids.length).toBe(12600);
		expect(new Set(ids).size).toBe(12600);
		expect(await runPoll(updatedRecordTrigger, store)).toEqual([]);
	});
});

function shuffled<T>(items: T[], seed: number): T[] {
	const result = [...items];
	let state = seed;
	for (let index = result.length - 1; index > 0; index -= 1) {
		state = (state * 1103515245 + 12345) % 2147483648;
		const swap = state % (index + 1);
		[result[index], result[swap]] = [result[swap], result[index]];
	}
	return result;
}

describe('tie order between polls', () => {
	it('loses nothing when tied rows come back from storage in a different order each poll', async () => {
		const tied = makeTieRecords({ count: 12000, epoch: BASE_EPOCH + 10_000 });
		const newer = makeTieRecords({ count: 50, epoch: BASE_EPOCH + 20_000, startIndex: 12000 });
		let storage = [...tied, ...newer];
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(storage.length);
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([
			LAST_MODIFIED_FIELD,
		]);
		const queries: (Record<string, unknown> | undefined)[] = [];
		mockListRecords(
			() => storage,
			(query) => queries.push(query)
		);

		for (const [trigger, storeKey] of [
			[newRecordTrigger, 'teable_new_record_frontier'],
			[updatedRecordTrigger, 'teable_updated_record_frontier'],
		] as const) {
			const store = memoryStore({ lastPoll: BASE_EPOCH });
			const polls: DeliveredRecord[][] = [];
			for (let round = 0; round < 8; round += 1) {
				storage = shuffled(storage, round + 1);
				const poll = await runPoll(trigger, store);
				if (poll.length === 0) {
					break;
				}
				polls.push(poll);
				const frontier = await store.get<FrontierSnapshot>(storeKey);
				if (frontier !== null) {
					expect(frontier.pending?.autoNumber).toBe(
						Math.max(...poll.map((record) => Number(record.id.slice(3)) + 1))
					);
				}
			}
			const ids = polls.flat().map((record) => record.id);
			expect(ids.length).toBe(12050);
			expect(new Set(ids).size).toBe(12050);
		}
		expect(queries.every((query) => query?.['viewId'] === undefined)).toBe(true);
	});
});

describe('at-least-once delivery', () => {
	const TIE_EPOCH = BASE_EPOCH + 10_000;

	it('re-emits the chunk when the checkpoint write fails, then confirms it', async () => {
		const records = makeTieRecords({ count: 7000, epoch: TIE_EPOCH });
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		mockListRecords(records);
		const inner = memoryStore({ lastPoll: BASE_EPOCH });
		const failures = new Map<string, 'reject' | 'write-then-reject'>([['lastPoll', 'reject']]);
		const store = failingPutStore({ inner, failures });

		await expect(runPoll(newRecordTrigger, store)).rejects.toThrow(/simulated put failure/);
		expect(await inner.get('lastPoll')).toBe(BASE_EPOCH);
		const afterFailure = await inner.get<FrontierSnapshot>('teable_new_record_frontier');
		const markedIds = afterFailure?.pending?.ids ?? [];
		expect(markedIds.length).toBeGreaterThan(0);

		const poll2 = await runPoll(newRecordTrigger, store);
		expect(new Set(poll2.map((record) => record.id))).toEqual(new Set(markedIds));

		const poll3 = await runPoll(newRecordTrigger, store);
		expect(await inner.get('teable_new_record_frontier')).toBeNull();
		const ids = [...poll2, ...poll3].map((record) => record.id);
		expect(ids.length).toBe(7000);
		expect(new Set(ids).size).toBe(7000);
		expect(await runPoll(newRecordTrigger, store)).toEqual([]);
	});

	it('re-emits the chunk after a crash right after the pending write', async () => {
		const records = makeTieRecords({ count: 7000, epoch: TIE_EPOCH });
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		mockListRecords(records);
		const inner = memoryStore({ lastPoll: BASE_EPOCH });
		const failures = new Map<string, 'reject' | 'write-then-reject'>([
			['teable_new_record_frontier', 'write-then-reject'],
		]);
		const store = failingPutStore({ inner, failures });

		await expect(runPoll(newRecordTrigger, store)).rejects.toThrow(/simulated crash/);
		expect(await inner.get('lastPoll')).toBe(BASE_EPOCH);
		const afterCrash = await inner.get<FrontierSnapshot>('teable_new_record_frontier');
		const markedIds = afterCrash?.pending?.ids ?? [];
		expect(markedIds.length).toBeGreaterThan(0);

		const poll2 = await runPoll(newRecordTrigger, store);
		expect(new Set(poll2.map((record) => record.id))).toEqual(new Set(markedIds));

		const poll3 = await runPoll(newRecordTrigger, store);
		const ids = [...poll2, ...poll3].map((record) => record.id);
		expect(ids.length).toBe(7000);
		expect(new Set(ids).size).toBe(7000);
		expect(await runPoll(newRecordTrigger, store)).toEqual([]);
	});
});

describe('tie-group forward progress', () => {
	it('delivers a 22,000-record tie group completely within a constant per-poll budget', async () => {
		const records = makeTieRecords({ count: 22000, epoch: BASE_EPOCH + 10_000 });
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		let listCalls = 0;
		mockListRecords(records, () => {
			listCalls += 1;
		});
		const store = memoryStore({ lastPoll: BASE_EPOCH });

		const polls: DeliveredRecord[][] = [];
		const budgets: number[] = [];
		for (let round = 0; round < 8; round += 1) {
			listCalls = 0;
			const poll = await runPoll(newRecordTrigger, store);
			budgets.push(listCalls);
			if (poll.length === 0) {
				break;
			}
			polls.push(poll);
		}

		for (const budget of budgets) {
			expect(budget).toBeLessThanOrEqual(60);
		}
		const ids = polls.flat().map((record) => record.id);
		expect(ids.length).toBe(22000);
		expect(new Set(ids).size).toBe(22000);
		expect(polls.length).toBeLessThanOrEqual(5);
		expect(await store.get('teable_new_record_frontier')).toBeNull();
	});
});

describe('new record trigger overflow', () => {
	it('delivers 12k records across three capped polls with no loss and no dupes', async () => {
		const records = makeRecords(12000);
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		mockListRecords(records);
		const store = memoryStore({ lastPoll: BASE_EPOCH - 1 });

		const polls = [
			await runPoll(newRecordTrigger, store),
			await runPoll(newRecordTrigger, store),
			await runPoll(newRecordTrigger, store),
		];

		expect(polls.flat().length).toBe(12000);
		const ids = polls.flat().map((record) => record.id);
		expect(new Set(ids).size).toBe(12000);
		expect(await runPoll(newRecordTrigger, store)).toEqual([]);
	});

	it('does not lose records when rows are deleted mid-scan', async () => {
		const records = makeRecords(1500);
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		let pageFetches = 0;
		mockListRecords(records, (query) => {
			if (query?.['take'] === 500) {
				pageFetches += 1;
				if (pageFetches === 2) {
					records.splice(5, 3);
				}
			}
		});
		const store = memoryStore({ lastPoll: BASE_EPOCH - 1 });

		const delivered = await runPoll(newRecordTrigger, store);
		const rest = await runPoll(newRecordTrigger, store);
		const ids = new Set([...delivered, ...rest].map((record) => record.id));
		expect(ids.size).toBe(1500);
	});
});

describe('updated record trigger overflow', () => {
	it('delivers 12k modified records across three capped polls with no loss and no dupes', async () => {
		const records = makeRecords(12000);
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([
			LAST_MODIFIED_FIELD,
		]);
		mockListRecords(records);
		const store = memoryStore({ lastPoll: BASE_EPOCH - 1 });

		const polls = [
			await runPoll(updatedRecordTrigger, store),
			await runPoll(updatedRecordTrigger, store),
			await runPoll(updatedRecordTrigger, store),
		];

		expect(polls.flat().length).toBe(12000);
		const ids = polls.flat().map((record) => record.id);
		expect(new Set(ids).size).toBe(12000);
		expect(await runPoll(updatedRecordTrigger, store)).toEqual([]);
	});

	it('does not lose records when rows are edited mid-scan', async () => {
		const records = makeRecords(2000);
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([
			LAST_MODIFIED_FIELD,
		]);
		let pageFetches = 0;
		mockListRecords(records, (query) => {
			if (query?.['take'] === 500) {
				pageFetches += 1;
				if (pageFetches === 2) {
					for (const index of [10, 11, 12]) {
						const bumped = iso(BASE_EPOCH + 5_000_000 + index * 1000);
						records[index] = {
							...records[index],
							fields: { LastModified: bumped },
							lastModifiedTime: bumped,
						};
					}
				}
			}
		});
		const store = memoryStore({ lastPoll: BASE_EPOCH - 1 });

		const delivered = await runPoll(updatedRecordTrigger, store);
		const rest = await runPoll(updatedRecordTrigger, store);
		const ids = new Set([...delivered, ...rest].map((record) => record.id));
		expect(ids.size).toBe(2000);
	});

	it('delivers a small batch in one poll once caught up', async () => {
		const records = makeRecords(120);
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([
			LAST_MODIFIED_FIELD,
		]);
		mockListRecords(records);
		const store = memoryStore({ lastPoll: BASE_EPOCH + 99 * 1000 });

		const delivered = await runPoll(updatedRecordTrigger, store);
		expect(delivered).toHaveLength(20);
		expect(await runPoll(updatedRecordTrigger, store)).toEqual([]);
	});
});

describe('updated record trigger field requirements', () => {
	const DATE_ONLY_FIELD = {
		id: 'fldDay',
		name: 'Modified day',
		type: 'lastModifiedTime',
		options: { formatting: { date: 'M/D/YYYY', time: 'None', timeZone: 'UTC' } },
	};

	it('refuses a field that hides the time of day, on enable and on poll', async () => {
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([DATE_ONLY_FIELD]);
		const listRecords = mockListRecords(makeRecords(10));
		const store = memoryStore({ lastPoll: BASE_EPOCH });

		await expect(updatedRecordTrigger.onEnable(pollContext({ store }))).rejects.toThrow(
			/"Modified day" hides the time of day/
		);
		await expect(runPoll(updatedRecordTrigger, store)).rejects.toThrow(/24 hour or 12 hour/);
		expect(listRecords).not.toHaveBeenCalled();
	});

	it('treats a field without formatting as date-only, like Teable does', async () => {
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([
			{ id: 'fldLM', name: 'LastModified', type: 'lastModifiedTime' },
		]);
		const store = memoryStore({ lastPoll: BASE_EPOCH });

		await expect(runPoll(updatedRecordTrigger, store)).rejects.toThrow(/hides the time of day/);
	});

	it('sorts by the field that shows the time when the table has several', async () => {
		const records = makeRecords(30);
		vi.spyOn(teableClient, 'getRowCount').mockResolvedValue(records.length);
		vi.spyOn(teableClient, 'listFields').mockResolvedValue([DATE_ONLY_FIELD, LAST_MODIFIED_FIELD]);
		const orderBys = new Set<unknown>();
		mockListRecords(records, (query) => orderBys.add(query?.['orderBy']));
		const store = memoryStore({ lastPoll: BASE_EPOCH + 9 * 1000 });

		const delivered = await runPoll(updatedRecordTrigger, store);
		expect(delivered).toHaveLength(20);
		expect([...orderBys]).toEqual([JSON.stringify([{ fieldId: 'fldLM', order: 'asc' }])]);
	});
});
