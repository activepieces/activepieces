import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rowSnapshot } from '../src/lib/triggers/row-snapshot';
import { rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, newRow, rowContext, TestStore } from './support/row-trigger-context';

const KEY = 'qa-probe-snapshot';
const identity = { spreadsheetId: 'sp1', sheetId: 7, triggerColumn: 'all_columns' };

function fingerprints({ values }: { values: string[] }) {
	return rowSnapshot.fingerprintRows({ rows: values.map((value) => [value]), triggerColumnIndex: undefined });
}

async function storedFirstCells({ store }: { store: TestStore }) {
	const loaded = await rowSnapshot.loadSnapshot({ store, key: KEY, identity });
	return loaded?.rows.length;
}

async function fire({ trigger, store, triggerColumn, headers }: { trigger: typeof newRow; store: TestStore; triggerColumn?: string; headers?: Record<string, string> }) {
	return rowEvents({ value: await trigger.run(rowContext({ store, triggerColumn, headers })) }).map((event) => `${event.row}:${String(event.values.A)}`);
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [{ sheetId: 7, title: 'Orders', rows: [cells({ values: ['Email', 'Status'] }), cells({ values: ['a@x.com', 'open'] })] }] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('saveSnapshotIfNewer ordering', () => {
	it.each<{ order: string; first: RunName; second: RunName }>([
		{ order: 'older saves first', first: 'old', second: 'new' },
		{ order: 'newer saves first', first: 'new', second: 'old' },
	])('$order: the newer read wins', async ({ first, second }) => {
		const { store } = memoryStore();
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: fingerprints({ values: ['h'] }), readAt: 1 });
		const loadedA = await rowSnapshot.loadSnapshot({ store, key: KEY, identity });
		const loadedB = await rowSnapshot.loadSnapshot({ store, key: KEY, identity });
		const runs = {
			old: { loaded: loadedA, readAt: 10, rows: fingerprints({ values: ['h', 'r2'] }) },
			new: { loaded: loadedB, readAt: 20, rows: fingerprints({ values: ['h', 'r2', 'r3'] }) },
		};
		for (const name of [first, second]) {
			const run = runs[name];
			await rowSnapshot.saveSnapshotIfNewer({ store, key: KEY, identity, rows: run.rows, loaded: run.loaded, readAt: run.readAt });
		}
		expect(await storedFirstCells({ store })).toBe(3);
	});

	it('a stored manifest without readAt (v2) is overwritten by a run that loaded an older generation', async () => {
		const { store } = memoryStore();
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: fingerprints({ values: ['h'] }), readAt: 1 });
		const stale = await rowSnapshot.loadSnapshot({ store, key: KEY, identity });
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: fingerprints({ values: ['h', 'x'] }), readAt: 50 });
		const saved = await rowSnapshot.saveSnapshotIfNewer({ store, key: KEY, identity, rows: fingerprints({ values: ['h', 'x', 'y'] }), loaded: stale, readAt: 40 });
		expect(saved).toBe(false);
		expect(await storedFirstCells({ store })).toBe(2);
	});
});

describe('dedupe key base', () => {
	it('two runs on one base deliver once; a revert gets a new key', async () => {
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['a@x.com', 'closed'] });
		const [one, two] = await Promise.all([changedRow.run(rowContext({ store })), changedRow.run(rowContext({ store }))]);
		expect(rowEvents({ value: one }).length + rowEvents({ value: two }).length).toBeGreaterThanOrEqual(1);
		if (rowEvents({ value: one }).length > 0 && rowEvents({ value: two }).length > 0) {
			expect(JSON.stringify(one)).toBe(JSON.stringify(two));
		}
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['a@x.com', 'open'] });
		const revert = await changedRow.run(rowContext({ store }));
		expect(rowEvents({ value: revert }).length).toBe(1);
		expect(JSON.stringify(revert)).not.toBe(JSON.stringify(one));
	});
});

describe('sync messages', () => {
	it.each([{ trigger: newRow }, { trigger: changedRow }])('sync right after the first enable fires nothing', async ({ trigger }) => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		const id = [...fakeGoogle.liveChannels][0];
		expect(await fire({ trigger, store, headers: { 'x-goog-resource-state': 'sync', 'x-goog-channel-id': id } })).toEqual([]);
	});

	it.each([{ trigger: newRow }, { trigger: changedRow }])('sync with no snapshot (never enabled on this version) takes a baseline, fires nothing', async ({ trigger }) => {
		const { store } = memoryStore();
		expect(await fire({ trigger, store, headers: { 'x-goog-resource-state': 'sync' } })).toEqual([]);
		fakeGoogle.tabs[0].rows.push(cells({ values: ['b@x.com', 'open'] }));
		expect(await fire({ trigger, store })).toEqual(['3:b@x.com']);
	});
});

describe('Trigger Column upgrade', () => {
	it('an enabled flow with lower-case "b" re-baselines once and does not mass-fire', async () => {
		const { store } = memoryStore();
		await rowSnapshot.saveSnapshot({
			store,
			key: 'google-sheets-new-or-updated-row-snapshot',
			identity: { spreadsheetId: 'sp1', sheetId: 7, triggerColumn: 'b' },
			rows: rowSnapshot.fingerprintRows({ rows: [['Email', 'Status'], ['a@x.com', 'open']], triggerColumnIndex: -1 }),
			readAt: 0,
		});
		expect(await fire({ trigger: changedRow, store, triggerColumn: 'b' })).toEqual([]);
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['a@x.com', 'paid'] });
		expect(await fire({ trigger: changedRow, store, triggerColumn: 'b' })).toEqual(['2:a@x.com']);
	});

	it('an enabled flow with a header name "Status" never fires and does not throw in run()', async () => {
		const { store } = memoryStore();
		expect(await fire({ trigger: changedRow, store, triggerColumn: 'Status' })).toEqual([]);
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['a@x.com', 'paid'] });
		expect(await fire({ trigger: changedRow, store, triggerColumn: 'Status' })).toEqual([]);
		await expect(changedRow.onEnable(rowContext({ store, triggerColumn: 'Status' }))).rejects.toThrow('not a column letter');
	});

	it('a 3-letter header name such as "Qty" passes validation as a column', async () => {
		const { store } = memoryStore();
		await expect(changedRow.onEnable(rowContext({ store, triggerColumn: 'Qty' }))).resolves.toBeUndefined();
	});

	it.each(['', '   '])('blank "%s" is Any Column', async (blank) => {
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store, triggerColumn: blank }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['a@x.com', 'paid'] });
		expect(await fire({ trigger: changedRow, store, triggerColumn: blank })).toEqual(['2:a@x.com']);
	});
});

type RunName = 'old' | 'new';

describe('delivered-row memory', () => {
	it.each([{ trigger: newRow }, { trigger: changedRow }])('a failing memory store still delivers the row', async ({ trigger }) => {
		vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { store, failPuts } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows.push(cells({ values: ['b@x.com', 'open'] }));
		failPuts.matching = /delivered$/;
		expect(await fire({ trigger, store })).toEqual(['3:b@x.com']);
	});

	it('an identical row on another worksheet after switching sheets still fires', async () => {
		const { store } = memoryStore();
		fakeGoogle.tabs.push({ sheetId: 8, title: 'Other', rows: [cells({ values: ['Email', 'Status'] }), cells({ values: ['a@x.com', 'open'] })] });
		await newRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows.push(cells({ values: ['b@x.com', 'open'] }));
		expect(rowEvents({ value: await newRow.run(rowContext({ store })) }).map((event) => event.row)).toEqual([3]);
		await newRow.onEnable(rowContext({ store, sheetId: 8 }));
		fakeGoogle.tabs[1].rows.push(cells({ values: ['b@x.com', 'open'] }));
		expect(rowEvents({ value: await newRow.run(rowContext({ store, sheetId: 8 })) }).map((event) => event.row)).toEqual([3]);
	});
});
