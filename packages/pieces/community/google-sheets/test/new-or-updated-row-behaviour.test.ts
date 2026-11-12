import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger';
import { rowSnapshot } from '../src/lib/triggers/row-snapshot';
import { engineContext, rowEvents, webhookTrigger } from './support/engine-context';
import { cells, fakeGoogle, FakeTab, installFakeGoogle, memoryStore, resetFakeGoogle, storeLimit } from './support/fake-google';

const trigger = webhookTrigger({ trigger: newOrUpdatedRowTrigger });

const CHANGE = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };

function ctx({ store, triggerColumn = 'all_columns', sheetId = 0, headers = CHANGE }: {
	store: ReturnType<typeof memoryStore>['store'];
	triggerColumn?: string;
	sheetId?: number;
	headers?: Record<string, string>;
}): Parameters<typeof trigger.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'ss1', sheetId, trigger_column: triggerColumn },
			store,
			webhookUrl: 'https://cloud.example/v1/webhooks/flow-1',
			payload: { headers, body: {}, queryParams: {} },
		},
	});
}

function sheet({ rows, title = 'Orders', sheetId = 0 }: { rows: (string | number)[][]; title?: string; sheetId?: number }): FakeTab {
	return { sheetId, title, rows: rows.map((values) => cells({ values })) };
}

function tab(): FakeTab {
	return fakeGoogle.tabs[0];
}

async function fire({ store, triggerColumn }: { store: ReturnType<typeof memoryStore>['store']; triggerColumn?: string }) {
	const out = rowEvents({ value: await trigger.run(ctx({ store, triggerColumn })) });
	return out.map((event) => `${event.row}:${Object.values(event.values).join('|')}`);
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({
		tabs: [sheet({ rows: [['Order', 'Customer', 'Status'], ['1001', 'Ann', 'paid'], ['1002', 'Bob', 'open'], ['1003', 'Cat', 'open']] })],
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('New or Updated Row behaviour', () => {
	it('fires once per edit across notifications and republish', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		expect(await fire({ store })).toEqual([]);
		tab().rows[2][2] = { value: 'paid' };
		expect(await fire({ store })).toEqual(['3:1002|Bob|paid']);
		expect(await fire({ store })).toEqual([]);
		await trigger.onDisable(ctx({ store }));
		await trigger.onEnable(ctx({ store }));
		expect(await fire({ store })).toEqual([]);
		tab().rows[3][2] = { value: 'paid' };
		expect(await fire({ store })).toEqual(['4:1003|Cat|paid']);
		expect(await fire({ store })).toEqual([]);
	});

	it('does not fire when rows only move', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		tab().rows.splice(1, 0, []);
		expect(await fire({ store })).toEqual([]);
		tab().rows.splice(1, 1);
		tab().rows.splice(2, 0, []);
		expect(await fire({ store })).toEqual([]);
		tab().rows.splice(2, 1);
		tab().rows.splice(1, 1);
		expect(await fire({ store })).toEqual([]);
		const [header, ...data] = tab().rows;
		tab().rows = [header, ...[...data].reverse()];
		expect(await fire({ store })).toEqual([]);
	});

	it('reports exactly the inserted row and the edited row when both happen in one notification', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		tab().rows.splice(1, 0, cells({ values: ['1000', 'Zed', 'new'] }));
		tab().rows[3][2] = { value: 'shipped' };
		expect(await fire({ store })).toEqual(['2:1000|Zed|new', '4:1002|Bob|shipped']);
	});

	it('ignores a format-only change and fires once for an inserted duplicate row', async () => {
		resetFakeGoogle({ tabs: [{ sheetId: 0, title: 'Orders', rows: [cells({ values: ['Item', 'Amount'] }), cells({ values: ['Pen', 1000] }), cells({ values: ['Ink', 250] })] }] });
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		for (const row of tab().rows.slice(1)) {
			row[1] = { value: row[1].value, format: (value) => `$${value.toFixed(2)}` };
		}
		expect(await fire({ store })).toEqual([]);
		tab().rows.push([{ value: 'Ink' }, { value: 250, format: (value) => `$${value.toFixed(2)}` }]);
		expect(await fire({ store })).toEqual(['4:Ink|$250.00']);
	});

	it('fires once with blank values when a whole row is cleared, with Any Column and with a Trigger Column', async () => {
		for (const triggerColumn of ['all_columns', 'C']) {
			resetFakeGoogle({ tabs: [sheet({ rows: [['Order', 'Customer', 'Status'], ['1001', 'Ann', 'paid'], ['1002', 'Bob', 'open'], ['1003', 'Cat', 'open']] })] });
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows[2] = [];
			expect(await fire({ store, triggerColumn })).toEqual(['3:||']);
			expect(await fire({ store, triggerColumn })).toEqual([]);
		}
	});

	it('with a Trigger Column, a new row waits for that column and other edits do not fire', async () => {
		const { store } = memoryStore();
		const triggerColumn = 'C';
		await trigger.onEnable(ctx({ store, triggerColumn }));
		tab().rows.push(cells({ values: ['1004', 'Dan', ''] }));
		expect(await fire({ store, triggerColumn })).toEqual([]);
		tab().rows[4][2] = { value: 'paid' };
		expect(await fire({ store, triggerColumn })).toEqual(['5:1004|Dan|paid']);
		tab().rows[4][1] = { value: 'Daniel' };
		expect(await fire({ store, triggerColumn })).toEqual([]);
	});

	it('keeps every stored value under the store limit on a 40,000-row sheet', async () => {
		const rows: (string | number)[][] = [['Event', 'Level']];
		for (let index = 1; index <= 40_000; index++) rows.push([`evt-${index}`, index % 3 === 0 ? 'error' : 'ok']);
		resetFakeGoogle({ tabs: [sheet({ rows, title: 'Log' })] });
		for (const triggerColumn of ['all_columns', 'B']) {
			const { store, data } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows.push(cells({ values: ['evt-40001', 'ok'] }));
			expect(await fire({ store, triggerColumn })).toEqual(['40002:evt-40001|ok']);
			tab().rows[10][1] = { value: 'error' };
			expect(await fire({ store, triggerColumn })).toEqual(['11:evt-10|error']);
			for (const value of data.values()) {
				expect(Buffer.byteLength(value, 'utf8')).toBeLessThan(storeLimit);
			}
			tab().rows.pop();
			tab().rows[10][1] = { value: 'ok' };
		}
	}, 30_000);

	it('runs the first notification after an upgrade with the old positional rule, then switches without re-firing', async () => {
		const { store, data } = memoryStore();
		const legacy = tab().rows.map((row) =>
			crypto.createHash('md5').update(JSON.stringify(row.map((cell) => String(cell.value)))).digest('hex'),
		);
		await store.put('0', legacy);
		await store.put('google-sheets-new-or-updated-row', { id: 'old-channel', resourceId: 'res-1' });
		tab().rows[1][2] = { value: 'refunded' };
		expect(await fire({ store })).toEqual(['2:1001|Ann|refunded']);
		expect(data.has('0')).toBe(false);
		expect(await fire({ store })).toEqual([]);
		tab().rows.splice(1, 0, cells({ values: ['1000', 'Zed', 'new'] }));
		expect(await fire({ store })).toEqual(['2:1000|Zed|new']);
	});

	it('reports the change on the next notification when saving the snapshot failed', async () => {
		const { store, failPuts } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		tab().rows[2][2] = { value: 'paid' };
		failPuts.matching = /_g\d+_0$/;
		await expect(trigger.run(ctx({ store }))).rejects.toThrow(/StorageError/);
		failPuts.matching = undefined;
		expect(await fire({ store })).toEqual(['3:1002|Bob|paid']);
		expect(await fire({ store })).toEqual([]);
	});

	it('removes chunks left behind by a failed save on the next successful save', async () => {
		const rows: (string | number)[][] = [['Event']];
		for (let index = 1; index <= 8_000; index++) rows.push([`evt-${index}`]);
		resetFakeGoogle({ tabs: [sheet({ rows, title: 'Log' })] });
		const { store, data, failPuts } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const extra = Array.from({ length: 8_000 }, (_, index) => cells({ values: [`more-${index}`] }));
		tab().rows.push(...extra);
		failPuts.matching = /-snapshot$/;
		await expect(trigger.run(ctx({ store }))).rejects.toThrow(/StorageError/);
		failPuts.matching = undefined;
		tab().rows.splice(8_001, 8_000);
		tab().rows[5][0] = { value: 'evt-5-fixed' };
		expect(await fire({ store })).toEqual(['6:evt-5-fixed']);
		const snapshotKeys = [...data.keys()].filter((key) => key.includes('-snapshot')).sort();
		expect(snapshotKeys).toEqual([
			'google-sheets-new-or-updated-row-snapshot',
			'google-sheets-new-or-updated-row-snapshot_g1_0',
			'google-sheets-new-or-updated-row-snapshot_g1_1',
			'google-sheets-new-or-updated-row-snapshot_g2_0',
			'google-sheets-new-or-updated-row-snapshot_g2_1',
		]);
	});

	it('does not rewrite the snapshot when nothing changed', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const put = vi.spyOn(store, 'put');
		expect(await fire({ store })).toEqual([]);
		expect(put).not.toHaveBeenCalled();
		tab().rows[2][2] = { value: 'paid' };
		expect(await fire({ store })).toEqual(['3:1002|Bob|paid']);
		expect(put).toHaveBeenCalled();
	});

	describe.each(['all_columns', 'C'])('deleting rows next to blank rows (Trigger Column %s)', (triggerColumn) => {
		function blankLayout({ rows }: { rows: (string | number)[][] }): void {
			resetFakeGoogle({ tabs: [sheet({ rows, title: 'Sheet1' })] });
		}

		it('does not fire when the row above a blank row is deleted (live step M)', async () => {
			blankLayout({ rows: [['Name', 'Email', 'Status'], ['Zed', 'zed@x.io', 'new'], [], ['Carol', 'carol@x.io', 'paid'], ['Bob', 'bob@x.io', 'open']] });
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows.splice(1, 1);
			expect(await fire({ store, triggerColumn })).toEqual([]);
			expect(await fire({ store, triggerColumn })).toEqual([]);
		});

		it('does not fire when the row below a blank row is deleted', async () => {
			blankLayout({ rows: [['Name', 'Email', 'Status'], [], ['Zed', 'zed@x.io', 'new'], ['Carol', 'carol@x.io', 'paid']] });
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows.splice(2, 1);
			expect(await fire({ store, triggerColumn })).toEqual([]);
		});

		it('does not fire when a row above two adjacent blank rows is deleted', async () => {
			blankLayout({ rows: [['Name', 'Email', 'Status'], ['Zed', 'zed@x.io', 'new'], [], [], ['Carol', 'carol@x.io', 'paid']] });
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows.splice(1, 1);
			expect(await fire({ store, triggerColumn })).toEqual([]);
		});

		it('does not fire when the blank row itself is deleted', async () => {
			blankLayout({ rows: [['Name', 'Email', 'Status'], ['Zed', 'zed@x.io', 'new'], [], ['Carol', 'carol@x.io', 'paid']] });
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows.splice(2, 1);
			expect(await fire({ store, triggerColumn })).toEqual([]);
		});

		it('still fires once, at its own row, when a row next to a blank row is cleared', async () => {
			blankLayout({ rows: [['Name', 'Email', 'Status'], ['Zed', 'zed@x.io', 'new'], [], ['Carol', 'carol@x.io', 'paid']] });
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows[1] = [];
			expect(await fire({ store, triggerColumn })).toEqual(['2:||']);
			expect(await fire({ store, triggerColumn })).toEqual([]);
		});

		it('still fires when a blank row inside the data is filled in', async () => {
			blankLayout({ rows: [['Name', 'Email', 'Status'], ['Zed', 'zed@x.io', 'new'], [], ['Carol', 'carol@x.io', 'paid']] });
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store, triggerColumn }));
			tab().rows[2] = cells({ values: ['Dan', 'dan@x.io', 'open'] });
			expect(await fire({ store, triggerColumn })).toEqual(['3:Dan|dan@x.io|open']);
		});
	});

	describe('overlapping notifications', () => {
		const SNAPSHOT_KEY = 'google-sheets-new-or-updated-row-snapshot';

		function holdRead(): { release: () => void } {
			const gate = { release: () => undefined };
			fakeGoogle.holdNextGridRead = new Promise<void>((resolve) => {
				gate.release = () => resolve();
			});
			return gate;
		}

		async function heldRead(): Promise<void> {
			for (let attempt = 0; attempt < 1000 && fakeGoogle.heldGridReads === 0; attempt++) {
				await new Promise((resolve) => setImmediate(resolve));
			}
		}

		function rowsWith({ status }: { status: Record<number, string> }): FakeTab['rows'] {
			const base = [['Order', 'Customer', 'Status'], ['1001', 'Ann', 'paid'], ['1002', 'Bob', 'open'], ['1003', 'Cat', 'open']];
			return base.map((values, index) => cells({ values: status[index] === undefined ? values : [values[0], values[1], status[index]] }));
		}

		it('a run that read the sheet before another run saved still reports its change', async () => {
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store }));
			tab().rows = rowsWith({ status: { 1: 'refunded' } });
			const gate = holdRead();
			const pending = fire({ store });
			await heldRead();
			tab().rows = rowsWith({ status: { 1: 'refunded', 2: 'shipped' } });
			const other = await fire({ store });
			gate.release();
			const first = await pending;
			expect(other).toEqual(['2:1001|Ann|refunded', '3:1002|Bob|shipped']);
			expect(first.map((event) => event.split('|')[0])).toContain('2:1001');
			expect(await fire({ store })).toEqual([]);
		});

		it('two saves during its read neither re-baseline it nor let it overwrite the newer snapshot', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			const { store } = memoryStore();
			await trigger.onEnable(ctx({ store }));
			tab().rows = rowsWith({ status: { 1: 'refunded' } });
			const gate = holdRead();
			const pending = fire({ store });
			await heldRead();
			tab().rows = rowsWith({ status: { 1: 'refunded', 2: 'shipped' } });
			await fire({ store });
			tab().rows = rowsWith({ status: { 1: 'refunded', 2: 'shipped', 3: 'lost' } });
			await fire({ store });
			gate.release();
			const first = await pending;
			expect(first.map((event) => event.split('|')[0])).toContain('2:1001');
			expect(warn.mock.calls.some(([message]) => String(message).includes('new baseline'))).toBe(false);
			expect(await fire({ store })).toEqual([]);
		});

		it('throws instead of re-baselining when the snapshot keeps changing on every attempt', async () => {
			const { store, data } = memoryStore();
			await trigger.onEnable(ctx({ store }));
			tab().rows = rowsWith({ status: { 1: 'refunded' } });
			const original = data.get(SNAPSHOT_KEY) ?? '';
			const churning = {
				...store,
				get: async <T>(key: string): Promise<T | null> => {
					if (key === SNAPSHOT_KEY) {
						const raw = data.get(key) ?? '';
						data.set(key, raw.replace(/"generation":(\d+)/, (_match, generation) => `"generation":${Number(generation) + 2}`));
					}
					return store.get<T>(key);
				},
			};
			await expect(trigger.run(ctx({ store: churning }))).rejects.toThrow(/notifications overlapped/);
			data.set(SNAPSHOT_KEY, original);
			expect(await fire({ store })).toEqual(['2:1001|Ann|refunded']);
		});
	});

	it('takes a new baseline instead of firing when the Trigger Column changed without a re-enable', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		tab().rows[2][2] = { value: 'paid' };
		expect(await fire({ store, triggerColumn: 'C' })).toEqual([]);
		tab().rows[3][2] = { value: 'paid' };
		expect(await fire({ store, triggerColumn: 'C' })).toEqual(['4:1003|Cat|paid']);
	});

	it.each(['Q1', "It's"])('works on a tab named %s', async (title) => {
		resetFakeGoogle({
			tabs: [sheet({ rows: [['Quarter'], ['Q1']], title: 'Summary', sheetId: 0 }), sheet({ rows: [['Name'], ['Ann']], title, sheetId: 7 })],
		});
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, sheetId: 7 }));
		fakeGoogle.tabs[1].rows.push(cells({ values: ['Bob'] }));
		const out = rowEvents({ value: await trigger.run(ctx({ store, sheetId: 7 })) });
		expect(out.map((event) => [event.row, event.values])).toEqual([[3, { A: 'Bob' }]]);
	});

	it('test() returns the newest data rows without the header', async () => {
		const { store } = memoryStore();
		const sample = rowEvents({ value: await trigger.test(ctx({ store })) });
		expect(sample.map((row) => row.row)).toEqual([4, 3, 2]);
	});
});

describe('New or Updated Row reads', () => {
	it('reads the sheet once per notification and emits the formatted values of that same read', async () => {
		const money = (value: number) => `$${value}.00`;
		resetFakeGoogle({
			tabs: [
				{
					sheetId: 0,
					title: 'Orders',
					rows: [
						cells({ values: ['Order', 'Amount'] }),
						[{ value: '1001' }, { value: 10, format: money }],
						[{ value: '1002' }, { value: 20, format: money }],
						[{ value: '1003' }, { value: 30, format: money }],
					],
				},
			],
		});
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		fakeGoogle.valueReads = [];
		fakeGoogle.gridReads = [];
		expect(await fire({ store })).toEqual([]);
		expect(fakeGoogle.gridReads).toEqual([{ range: 'Orders' }]);
		fakeGoogle.gridReads = [];
		tab().rows[3][1] = { value: 35, format: money };
		expect(await fire({ store })).toEqual(['4:1003|$35.00']);
		expect(fakeGoogle.gridReads).toEqual([{ range: 'Orders' }]);
		expect(fakeGoogle.valueReads).toEqual([]);
	});
});

describe('row snapshot written by two overlapping notifications', () => {
	const KEY = 'overlap-snapshot';
	const identity = { spreadsheetId: 'ss1', sheetId: 0, triggerColumn: 'all_columns' };

	function rows({ count, tag }: { count: number; tag: string }) {
		return rowSnapshot.fingerprintRows({
			rows: Array.from({ length: count }, (_, index) => [`${tag}-${index}`]),
			triggerColumnIndex: undefined,
		});
	}

	it('never compares against a mix of two writes and falls back to the retained generation', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { store, data } = memoryStore();
		const base = rows({ count: 9_000, tag: 'base' });
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: base, readAt: 1 });
		const baseManifest = data.get(KEY) ?? '';
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: rows({ count: 9_000, tag: 'a' }), readAt: 2 });
		const chunkFromA = data.get(`${KEY}_g2_1`) ?? '';
		data.set(KEY, baseManifest);
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: rows({ count: 9_000, tag: 'b' }), readAt: 3 });
		data.set(`${KEY}_g2_1`, chunkFromA);
		expect((await rowSnapshot.loadSnapshot({ store, key: KEY, identity }))?.rows).toEqual(base);
		expect(warn.mock.calls.some(([message]) => String(message).includes('overlapping notification'))).toBe(true);
	});

	it('reads the newest write when its chunks are intact', async () => {
		const { store } = memoryStore();
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: rows({ count: 9_000, tag: 'base' }), readAt: 1 });
		const latest = rows({ count: 9_000, tag: 'next' });
		await rowSnapshot.saveSnapshot({ store, key: KEY, identity, rows: latest, readAt: 2 });
		expect((await rowSnapshot.loadSnapshot({ store, key: KEY, identity }))?.rows).toEqual(latest);
	});
});
