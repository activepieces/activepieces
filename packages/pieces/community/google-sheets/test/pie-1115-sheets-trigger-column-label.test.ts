import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { labelToColumn } from '../src/lib/common/common';
import { rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, rowContext, tabOf } from './support/row-trigger-context';

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [tabOf({ rows: [['Name', 'Status'], ['alice', 'new'], ['bob', 'new']] })] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1115 New or Updated Row with a Trigger Column typed outside the dropdown', () => {
	it.each(['b', ' B ', 'B'])('Trigger Column "%s" fires when a cell in column B changes', async (triggerColumn) => {
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store, triggerColumn }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['alice', 'done'] });
		const out = rowEvents({ value: await changedRow.run(rowContext({ store, triggerColumn })) });
		expect(out.map((event) => event.row)).toEqual([2]);
	});

	it('a column A edit does not fire with Trigger Column "b"', async () => {
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store, triggerColumn: 'b' }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['alicia', 'new'] });
		expect(await changedRow.run(rowContext({ store, triggerColumn: 'b' }))).toEqual([]);
	});

	it.each(['2', 'Status', 'B1', 'AAAA'])('a Trigger Column "%s" that is not a column letter fails when the flow is enabled', async (triggerColumn) => {
		const { store } = memoryStore();
		await expect(changedRow.onEnable(rowContext({ store, triggerColumn }))).rejects.toThrow(/not a column letter/);
	});

	it('labelToColumn accepts any case and padding and rejects non-letters', () => {
		expect([labelToColumn('a'), labelToColumn(' ab '), labelToColumn('AB'), labelToColumn('A1'), labelToColumn('')]).toEqual([0, 27, 27, -1, -1]);
	});
});
