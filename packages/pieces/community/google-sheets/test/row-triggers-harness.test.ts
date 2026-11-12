import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sheetGridFromRowData } from '../src/lib/triggers/helpers';
import { rowSnapshot } from '../src/lib/triggers/row-snapshot';
import { dedupeWindow } from './support/dedupe-window';
import { isRecord, rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, newRow, rowContext, tabOf, TestStore } from './support/row-trigger-context';

const cases = [
	{ name: 'New Row Added', trigger: newRow, snapshotKey: 'googlesheets_new_row_added_snapshot', triggerColumn: 'first_cell' },
	{ name: 'New or Updated Row', trigger: changedRow, snapshotKey: 'google-sheets-new-or-updated-row-snapshot', triggerColumn: 'all_columns' },
];

function rows() {
	return fakeGoogle.tabs[0].rows;
}

async function fire({ trigger, store }: { trigger: typeof newRow; store: TestStore }): Promise<string[]> {
	return rowEvents({ value: await trigger.run(rowContext({ store })) }).map((event) => `${event.row}:${String(event.values.A)}`);
}

function money(value: number): string {
	return `$${value.toFixed(2)}`;
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({
		tabs: [
			{
				sheetId: 7,
				title: 'Orders',
				rows: [
					cells({ values: ['Order', 'Amount', 'Placed'] }),
					[{ value: '1001' }, { value: 10.5, format: money }, { value: 45000, format: () => '2023-03-15' }],
					[{ value: '1002' }, { value: 20, format: money }, { value: 45001, format: () => '2023-03-16' }],
				],
			},
		],
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('grid read fingerprints match the old UNFORMATTED_VALUE read', () => {
	it('numbers, date serials, booleans, formulas, errors and blanks fingerprint the same', () => {
		const grid = sheetGridFromRowData({
			startRow: 0,
			rowData: [
				{
					values: [
						{ effectiveValue: { numberValue: 3.5 }, formattedValue: '$3.50' },
						{ effectiveValue: { numberValue: 45000 }, formattedValue: '2023-03-15' },
						{ effectiveValue: { boolValue: true }, formattedValue: 'TRUE' },
						{ effectiveValue: { stringValue: 'from formula' }, formattedValue: 'from formula' },
						{ effectiveValue: { errorValue: { type: 'DIV_BY_ZERO' } }, formattedValue: '#DIV/0!' },
						{},
						{ effectiveValue: { stringValue: 'x' }, formattedValue: 'x' },
						{},
					],
				},
				{},
				{ values: [{ effectiveValue: { numberValue: 0 }, formattedValue: '0' }] },
				{ values: [{}, {}] },
			],
		});
		const unformatted = [[3.5, 45000, true, 'from formula', '#DIV/0!', '', 'x'], [], [0]];
		expect(grid.raw).toEqual(unformatted);
		expect(grid.display).toEqual([['$3.50', '2023-03-15', 'TRUE', 'from formula', '#DIV/0!', '', 'x'], [], ['0']]);
		expect(rowSnapshot.fingerprintRows({ rows: grid.raw, triggerColumnIndex: undefined })).toEqual(
			rowSnapshot.fingerprintRows({ rows: unformatted, triggerColumnIndex: undefined }),
		);
		expect(rowSnapshot.fingerprintRowsByFirstCell({ rows: grid.raw })).toEqual(rowSnapshot.fingerprintRowsByFirstCell({ rows: unformatted }));
	});
});

describe.each(cases)('$name lifecycle', ({ trigger, snapshotKey, triggerColumn }) => {
	it('enable, append, nothing, republish, nothing, append once', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		expect(await fire({ trigger, store })).toEqual([]);
		rows().push(cells({ values: ['1003', 30] }));
		expect(await fire({ trigger, store })).toEqual(['4:1003']);
		expect(await fire({ trigger, store })).toEqual([]);
		await trigger.onDisable(rowContext({ store }));
		await trigger.onEnable(rowContext({ store }));
		expect(await fire({ trigger, store })).toEqual([]);
		rows().push(cells({ values: ['1004', 40] }));
		expect(await fire({ trigger, store })).toEqual(['5:1004']);
	});

	it('a v2 snapshot written before the upgrade (values.get read, no readAt) fires nothing', async () => {
		const { store, data } = memoryStore();
		const unformatted = rows().map((row) => row.map((cell) => cell.value));
		const fingerprints =
			triggerColumn === 'first_cell'
				? rowSnapshot.fingerprintRowsByFirstCell({ rows: unformatted })
				: rowSnapshot.fingerprintRows({ rows: unformatted, triggerColumnIndex: undefined });
		await rowSnapshot.saveSnapshot({ store, key: snapshotKey, identity: { spreadsheetId: 'sp1', sheetId: 7, triggerColumn }, rows: fingerprints, readAt: 0 });
		const manifest: unknown = JSON.parse(data.get(snapshotKey) ?? '{}');
		if (!isRecord(manifest)) throw new Error('manifest missing');
		const legacy = Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== 'readAt'));
		data.set(snapshotKey, JSON.stringify(legacy));
		expect(await fire({ trigger, store })).toEqual([]);
		rows().push(cells({ values: ['1003', 30] }));
		expect(await fire({ trigger, store })).toEqual(['4:1003']);
	});

	it('a blank row 1 still emits every column of a new row', async () => {
		resetFakeGoogle({ tabs: [tabOf({ rows: [[], ['1001', 'paid']] })] });
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		rows().push(cells({ values: ['1002', 'open', 'note'] }));
		const out = rowEvents({ value: await trigger.run(rowContext({ store })) });
		expect(out.map((event) => event.values)).toEqual([{ A: '1002', B: 'open', C: 'note' }]);
	});

	it('a sort between notifications fires nothing', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		const [header, ...data] = rows();
		fakeGoogle.tabs[0].rows = [header, ...[...data].reverse()];
		expect(await fire({ trigger, store })).toEqual([]);
	});

	it('two overlapping runs on the same base collapse in the dedupe window', async () => {
		const { store } = memoryStore();
		const dedupe = dedupeWindow({ windowMs: 30_000 });
		await trigger.onEnable(rowContext({ store }));
		rows().push(cells({ values: ['1003', 30] }));
		const [first, second] = await Promise.all([trigger.run(rowContext({ store })), trigger.run(rowContext({ store }))]);
		expect([...dedupe.filter({ output: first }), ...dedupe.filter({ output: second })].length).toBe(1);
		expect(await fire({ trigger, store })).toEqual([]);
	});

	it('emits formatted values', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		rows().push([{ value: '1003' }, { value: 7, format: money }]);
		const out = rowEvents({ value: await trigger.run(rowContext({ store })) });
		expect(out.map((event) => event.values)).toEqual([{ A: '1003', B: '$7.00', C: '' }]);
	});
});
