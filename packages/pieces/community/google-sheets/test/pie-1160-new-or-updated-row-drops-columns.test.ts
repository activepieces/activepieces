import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dedupeWindow } from './support/dedupe-window';
import { rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, rowContext, tabOf, TestStore } from './support/row-trigger-context';

async function sampleFor({ store, row }: { store: TestStore; row: number }) {
	const sample = rowEvents({ value: await changedRow.test(rowContext({ store })) });
	return sample.find((event) => event.row === row)?.values;
}

beforeEach(() => {
	installFakeGoogle();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1160 New or Updated Row emits every column, like its sample', () => {
	it('a changed row keeps the cell to the right of the last heading, as in the test sample', async () => {
		resetFakeGoogle({ tabs: [tabOf({ rows: [['Order', 'Status'], ['1001', 'paid', 'gift wrap'], ['1002', 'open']] })] });
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['1001', 'paid', 'gift wrap + card'] });
		const sample = await sampleFor({ store, row: 2 });
		expect(sample).toEqual({ A: '1001', B: 'paid', C: 'gift wrap + card' });
		const delivered = rowEvents({ value: await changedRow.run(rowContext({ store })) });
		expect(delivered.map((event) => ({ row: event.row, values: event.values }))).toEqual([{ row: 2, values: sample }]);
	});

	it('a sheet whose first row is blank still delivers the changed row values', async () => {
		resetFakeGoogle({ tabs: [tabOf({ rows: [[], ['1001', 'paid'], ['1002', 'open']] })] });
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows[2] = cells({ values: ['1002', 'paid'] });
		const sample = await sampleFor({ store, row: 3 });
		expect(sample).toEqual({ A: '1002', B: 'paid' });
		const delivered = rowEvents({ value: await changedRow.run(rowContext({ store })) });
		expect(delivered.map((event) => ({ row: event.row, values: event.values }))).toEqual([{ row: 3, values: sample }]);
	});

	it('two different edits of that cell within the 30 s dedupe window both start the flow', async () => {
		resetFakeGoogle({ tabs: [tabOf({ rows: [['Order', 'Status'], ['1001', 'paid', 'gift wrap'], ['1002', 'open']] })] });
		const { store } = memoryStore();
		const dedupe = dedupeWindow({ windowMs: 30_000 });
		await changedRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['1001', 'paid', 'no gift wrap'] });
		const first = dedupe.filter({ output: await changedRow.run(rowContext({ store })) });
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['1001', 'paid', 'gift wrap after all'] });
		const second = dedupe.filter({ output: await changedRow.run(rowContext({ store })) });
		expect([first.length, second.length]).toEqual([1, 1]);
	});
});
