import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger';
import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook';
import { engineContext, rowEvents } from './support/engine-context';
import { cells, fakeGoogle, FakeTab, installFakeGoogle, memoryStore, resetFakeGoogle, storeLimit } from './support/fake-google';

const CHANGE = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };
const NUOR_SNAPSHOT = 'google-sheets-new-or-updated-row-snapshot';
const NUOR_CHANNEL = 'google-sheets-new-or-updated-row';
const NRA_CHANNEL = 'googlesheets_new_row_added';

type MemStore = ReturnType<typeof memoryStore>['store'];

function ctx<T>({ store, triggerColumn = 'all_columns', headers = CHANGE }: { store: MemStore; triggerColumn?: string; headers?: Record<string, string> }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'ss1', sheetId: 0, trigger_column: triggerColumn },
			store,
			webhookUrl: 'https://cloud.example/v1/webhooks/flow-1',
			payload: { headers, body: {}, queryParams: {} },
		},
	});
}

function sheet({ rows }: { rows: (string | number)[][] }): FakeTab {
	return { sheetId: 0, title: 'Orders', rows: rows.map((values) => cells({ values })) };
}

function tab(): FakeTab {
	return fakeGoogle.tabs[0];
}

async function nuor({ store, triggerColumn, headers }: { store: MemStore; triggerColumn?: string; headers?: Record<string, string> }) {
	const out = rowEvents({ value: await newOrUpdatedRowTrigger.run(ctx({ store, triggerColumn, headers })) });
	return out.map((event) => `${event.row}:${Object.values(event.values).join('|')}`);
}

async function nra({ store, headers }: { store: MemStore; headers?: Record<string, string> }) {
	const out = rowEvents({ value: await newRowAddedTrigger.run(ctx({ store, headers })) });
	return out.map((event) => `${event.row}:${Object.values(event.values).join('|')}`);
}

function legacyHashes({ triggerColumnIndex }: { triggerColumnIndex: number | undefined }): string[] {
	return tab().rows.map((row) => {
		const values = row.map((cell) => (typeof cell.value === 'number' && cell.format ? cell.format(cell.value) : String(cell.value)));
		const target = triggerColumnIndex === undefined ? values : values[triggerColumnIndex] ? [values[triggerColumnIndex]] : [];
		return crypto.createHash('md5').update(JSON.stringify(target)).digest('hex');
	});
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({
		tabs: [sheet({ rows: [['Order', 'Customer', 'Status'], ['1001', 'Ann', 'paid'], ['1002', 'Bob', 'open'], ['1003', 'Cat', 'open']] })],
	});
	vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('QA probe: upgrade from legacy state', () => {
	it('NUOR legacy hash list, no change in the first notification: nothing fires, then v2 written', async () => {
		tab().rows[1][0] = { value: 1001, format: (value) => `#${value}` };
		const { store, data } = memoryStore();
		await store.put('0', legacyHashes({ triggerColumnIndex: undefined }));
		expect(await nuor({ store })).toEqual([]);
		expect(data.has('0')).toBe(false);
		expect(data.has(NUOR_SNAPSHOT)).toBe(true);
		expect(await nuor({ store })).toEqual([]);
		tab().rows.splice(1, 0, cells({ values: ['1000', 'Zed', 'new'] }));
		expect(await nuor({ store })).toEqual(['2:1000|Zed|new']);
	});

	it('NUOR legacy hash list with a Trigger Column: no-op notification fires nothing, a Status edit fires once', async () => {
		const { store } = memoryStore();
		await store.put('0', legacyHashes({ triggerColumnIndex: 2 }));
		expect(await nuor({ store, triggerColumn: 'C' })).toEqual([]);
		tab().rows[3][2] = { value: 'paid' };
		expect(await nuor({ store, triggerColumn: 'C' })).toEqual(['4:1003|Cat|paid']);
		expect(await nuor({ store, triggerColumn: 'C' })).toEqual([]);
	});

	it('NUOR legacy notification that edits one row and appends one row reports both', async () => {
		const { store } = memoryStore();
		await store.put('0', legacyHashes({ triggerColumnIndex: undefined }));
		tab().rows[2][2] = { value: 'paid' };
		tab().rows.push(cells({ values: ['1004', 'Dan', 'open'] }));
		expect(await nuor({ store })).toEqual(['3:1002|Bob|paid', '5:1004|Dan|open']);
		expect(await nuor({ store })).toEqual([]);
	});

	it('NUOR legacy notification that clears a whole row keeps main behaviour and does not report it later either', async () => {
		const { store } = memoryStore();
		await store.put('0', legacyHashes({ triggerColumnIndex: undefined }));
		tab().rows[2] = [];
		expect(await nuor({ store })).toEqual([]);
		expect(await nuor({ store })).toEqual([]);
	});

	it('NRA legacy row count: no-op fires nothing, append fires once, then v2 ignores a sort', async () => {
		const { store, data } = memoryStore();
		await store.put('0', 4);
		expect(await nra({ store })).toEqual([]);
		expect(data.has('0')).toBe(false);
		tab().rows.push(cells({ values: ['1004', 'Dan', 'open'] }));
		expect(await nra({ store })).toEqual(['5:1004|Dan|open']);
		const [header, ...rows] = tab().rows;
		tab().rows = [header, ...[...rows].reverse()];
		expect(await nra({ store })).toEqual([]);
	});

	it('NRA legacy row count, append in the legacy notification is delivered', async () => {
		const { store } = memoryStore();
		await store.put('0', 4);
		tab().rows.push(cells({ values: ['1004', 'Dan', 'open'] }), cells({ values: ['1005', 'Eve', 'open'] }));
		expect(await nra({ store })).toEqual(['5:1004|Dan|open', '6:1005|Eve|open']);
		expect(await nra({ store })).toEqual([]);
	});
});

describe('QA probe: chunked snapshot storage', () => {
	function bigSheet({ count }: { count: number }) {
		const rows: (string | number)[][] = [['Event', 'Level']];
		for (let index = 1; index <= count; index++) rows.push([`evt-${index}`, `lvl-${index}`]);
		resetFakeGoogle({ tabs: [sheet({ rows })] });
	}

	it('keeps each chunk under the store limit with two fingerprints per row (Trigger Column)', async () => {
		bigSheet({ count: 24_000 });
		const { store, data } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store, triggerColumn: 'B' }));
		const manifest = JSON.parse(data.get(NUOR_SNAPSHOT) ?? '{}');
		expect(manifest.chunkCount).toBe(4);
		expect(manifest.entryWidth).toBe(32);
		for (const value of data.values()) expect(Buffer.byteLength(value, 'utf8')).toBeLessThan(storeLimit);
		const biggest = Math.max(...[...data.values()].map((value) => Buffer.byteLength(value, 'utf8')));
		expect(biggest).toBeGreaterThan(storeLimit / 3);
	});

	it('a failed middle-chunk write keeps the old manifest consistent and the change is reported next time', async () => {
		bigSheet({ count: 20_000 });
		const { store, data, failPuts } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store, triggerColumn: 'B' }));
		const before = data.get(NUOR_SNAPSHOT);
		tab().rows[15_000][1] = { value: 'changed' };
		failPuts.matching = /_g2_1$/;
		await expect(newOrUpdatedRowTrigger.run(ctx({ store, triggerColumn: 'B' }))).rejects.toThrow(/StorageError/);
		expect(data.get(NUOR_SNAPSHOT)).toBe(before);
		for (let chunk = 0; chunk < 3; chunk++) expect(data.has(`${NUOR_SNAPSHOT}_g1_${chunk}`)).toBe(true);
		failPuts.matching = undefined;
		expect(await nuor({ store, triggerColumn: 'B' })).toEqual(['15001:evt-15000|changed']);
		expect(await nuor({ store, triggerColumn: 'B' })).toEqual([]);
		const snapshotKeys = [...data.keys()].filter((key) => key.startsWith(NUOR_SNAPSHOT)).sort();
		expect(snapshotKeys).toEqual([NUOR_SNAPSHOT, `${NUOR_SNAPSHOT}_g1_0`, `${NUOR_SNAPSHOT}_g1_1`, `${NUOR_SNAPSHOT}_g1_2`, `${NUOR_SNAPSHOT}_g2_0`, `${NUOR_SNAPSHOT}_g2_1`, `${NUOR_SNAPSHOT}_g2_2`]);
	});

	it('a failed manifest write keeps the old snapshot and the change is reported next time', async () => {
		const { store, data, failPuts } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store }));
		tab().rows[1][2] = { value: 'refunded' };
		failPuts.matching = new RegExp(`^${NUOR_SNAPSHOT}$`);
		await expect(newOrUpdatedRowTrigger.run(ctx({ store }))).rejects.toThrow(/StorageError/);
		failPuts.matching = undefined;
		expect(JSON.parse(data.get(NUOR_SNAPSHOT) ?? '{}').generation).toBe(1);
		expect(await nuor({ store })).toEqual(['2:1001|Ann|refunded']);
	});

	it('a corrupt chunk is treated as no state (re-baseline), not a mass fire', async () => {
		const { store, data } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store }));
		data.set(`${NUOR_SNAPSHOT}_g1_0`, JSON.stringify('abc'));
		tab().rows[1][2] = { value: 'refunded' };
		expect(await nuor({ store })).toEqual([]);
		tab().rows[2][2] = { value: 'refunded' };
		expect(await nuor({ store })).toEqual(['3:1002|Bob|refunded']);
	});
});

describe('QA probe: duplicate identical rows', () => {
	beforeEach(() => {
		resetFakeGoogle({
			tabs: [sheet({ rows: [['Order', 'Customer', 'Status'], ['1001', 'Ann', 'paid'], ['1001', 'Ann', 'paid'], ['1003', 'Cat', 'open']] })],
		});
	});

	it('inserting another duplicate fires once (NUOR) and not at all for an insert above the bottom (NRA)', async () => {
		const a = memoryStore();
		const b = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store: a.store }));
		await newRowAddedTrigger.onEnable(ctx({ store: b.store }));
		tab().rows.splice(2, 0, cells({ values: ['1001', 'Ann', 'paid'] }));
		expect(await nuor({ store: a.store })).toHaveLength(1);
		expect(await nra({ store: b.store })).toEqual([]);
	});

	it('deleting one of two duplicates fires nothing', async () => {
		const a = memoryStore();
		const b = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store: a.store }));
		await newRowAddedTrigger.onEnable(ctx({ store: b.store }));
		tab().rows.splice(1, 1);
		expect(await nuor({ store: a.store })).toEqual([]);
		expect(await nra({ store: b.store })).toEqual([]);
	});

	it('sorting with duplicates fires nothing', async () => {
		const a = memoryStore();
		const b = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store: a.store }));
		await newRowAddedTrigger.onEnable(ctx({ store: b.store }));
		const [header, ...rows] = tab().rows;
		tab().rows = [header, rows[2], rows[0], rows[1]];
		expect(await nuor({ store: a.store })).toEqual([]);
		expect(await nra({ store: b.store })).toEqual([]);
	});

	it('editing the second of two duplicates fires exactly that row', async () => {
		const { store } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store }));
		tab().rows[2][2] = { value: 'refunded' };
		expect(await nuor({ store })).toEqual(['3:1001|Ann|refunded']);
	});
});

describe('QA probe: row edited and moved in one notification', () => {
	it('Any Column: fires exactly the edited row at its new position', async () => {
		const { store } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store }));
		const [header, ann, bob, cat] = tab().rows;
		tab().rows = [header, bob, cat, [ann[0], ann[1], { value: 'refunded' }]];
		expect(await nuor({ store })).toEqual(['4:1001|Ann|refunded']);
	});

	it('Trigger Column: fires when the watched column changed while the row moved', async () => {
		const { store } = memoryStore();
		await newOrUpdatedRowTrigger.onEnable(ctx({ store, triggerColumn: 'C' }));
		const [header, ann, bob, cat] = tab().rows;
		tab().rows = [header, bob, cat, [ann[0], ann[1], { value: 'refunded' }]];
		expect(await nuor({ store, triggerColumn: 'C' })).toEqual(['4:1001|Ann|refunded']);
	});

	it('NRA: an edited row moved to the bottom is not reported as new', async () => {
		const { store } = memoryStore();
		await newRowAddedTrigger.onEnable(ctx({ store }));
		const [header, ann, bob, cat] = tab().rows;
		tab().rows = [header, bob, cat, [ann[0], ann[1], { value: 'refunded' }]];
		expect(await nra({ store })).toEqual([]);
	});
});

describe('QA probe: channel id after a renew whose old-channel stop failed', () => {
	it.each([
		{ name: 'NUOR', trigger: newOrUpdatedRowTrigger, key: NUOR_CHANNEL, run: nuor },
		{ name: 'NRA', trigger: newRowAddedTrigger, key: NRA_CHANNEL, run: nra },
	])('$name: the replaced channel is still processed, the row fires once, an unknown channel is ignored', async ({ trigger, key, run }) => {
		const { store, data } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const oldId = (await store.get<{ id: string }>(key))?.id ?? '';
		fakeGoogle.failNextStop = true;
		await trigger.onRenew!(ctx({ store }));
		const newId = (await store.get<{ id: string }>(key))?.id ?? '';
		expect(newId).not.toBe(oldId);
		expect(fakeGoogle.liveChannels.has(oldId)).toBe(true);
		tab().rows.push(cells({ values: ['1004', 'Dan', 'open'] }));
		const snapshotBefore = [...data.entries()].filter(([entryKey]) => entryKey.includes('snapshot'));
		const readsBefore = fakeGoogle.gridReads.length;
		expect(await run({ store, headers: { ...CHANGE, 'x-goog-channel-id': 'someone-else' } })).toEqual([]);
		expect(fakeGoogle.gridReads.length).toBe(readsBefore);
		expect([...data.entries()].filter(([entryKey]) => entryKey.includes('snapshot'))).toEqual(snapshotBefore);
		expect(await run({ store, headers: { ...CHANGE, 'x-goog-channel-id': oldId } })).toEqual(['5:1004|Dan|open']);
		expect(await run({ store, headers: { ...CHANGE, 'x-goog-channel-id': newId } })).toEqual([]);
	});
});
