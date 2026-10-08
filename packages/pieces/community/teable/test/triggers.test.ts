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
	records: TeableRecord[],
	beforeCall?: (query: Record<string, unknown> | undefined) => void
) {
	return vi
		.spyOn(teableClient, 'listRecords')
		.mockImplementation(async ({ query }) => {
			beforeCall?.(query);
			let rows = [...records];
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
		const frontier1 = await store.get<{ epoch: number; ids: string[] }>(
			'teable_new_record_frontier'
		);
		expect(frontier1?.epoch).toBe(TIE_EPOCH);
		expect(frontier1?.ids).toHaveLength(poll1.length);

		const poll2 = await runPoll(newRecordTrigger, store);
		const frontier2 = await store.get<{ epoch: number; ids: string[] }>(
			'teable_new_record_frontier'
		);
		expect(frontier2?.ids).toHaveLength(poll1.length + poll2.length);

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
			{ id: 'fldLM', name: 'LastModified', type: 'lastModifiedTime' },
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
			{ id: 'fldLM', name: 'LastModified', type: 'lastModifiedTime' },
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
			{ id: 'fldLM', name: 'LastModified', type: 'lastModifiedTime' },
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
			{ id: 'fldLM', name: 'LastModified', type: 'lastModifiedTime' },
		]);
		mockListRecords(records);
		const store = memoryStore({ lastPoll: BASE_EPOCH + 99 * 1000 });

		const delivered = await runPoll(updatedRecordTrigger, store);
		expect(delivered).toHaveLength(20);
		expect(await runPoll(updatedRecordTrigger, store)).toEqual([]);
	});
});
