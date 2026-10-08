import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createMockPollingTriggerContext,
	InputPropertyMap,
	Store,
} from '@activepieces/pieces-framework';
import { teableClient, TeableRecord } from '../src/lib/common/client';
import { teablePolling } from '../src/lib/common/polling';
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

describe('dropIncompleteNewest', () => {
	const epochOf = (record: TeableRecord) => Date.parse(record.lastModifiedTime ?? '');

	it('drops only the records at the newest timestamp', () => {
		const records = makeRecords(3);
		const trimmed = teablePolling.dropIncompleteNewest({ records, epochOf });
		expect(trimmed.map((record) => record.id)).toEqual(['rec0', 'rec1']);
	});

	it('keeps everything when all records share one timestamp', () => {
		const records = makeRecords(3).map((record) => ({
			...record,
			lastModifiedTime: iso(BASE_EPOCH),
		}));
		const trimmed = teablePolling.dropIncompleteNewest({ records, epochOf });
		expect(trimmed).toHaveLength(3);
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
