import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, newRow, rowContext, tabOf } from './support/row-trigger-context';

function tab() {
	return fakeGoogle.tabs[0];
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [tabOf({ rows: [['Email', 'Amount'], ['a@x.com', '1'], ['b@x.com', '2'], ['c@x.com', '3'], ['d@x.com', '4']] })] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1104 the row emitted is the row that was diffed', () => {
	it('New Row Added: a row deleted higher up right after the read does not swallow the appended row', async () => {
		const { store } = memoryStore();
		await newRow.onEnable(rowContext({ store }));
		tab().rows.push(cells({ values: ['new@x.com', '99'] }));
		fakeGoogle.afterNextGridRead = () => {
			tab().rows.splice(2, 1);
		};
		const first = rowEvents({ value: await newRow.run(rowContext({ store })) });
		const second = rowEvents({ value: await newRow.run(rowContext({ store })) });
		expect([...first, ...second].map((event) => event.values.A)).toEqual(['new@x.com']);
	});

	it('New Row Added: rows sorted right after the read do not replace the appended row with an old one', async () => {
		const { store } = memoryStore();
		await newRow.onEnable(rowContext({ store }));
		tab().rows.push(cells({ values: ['a0@x.com', '0'] }));
		fakeGoogle.afterNextGridRead = () => {
			const [header, ...data] = tab().rows;
			tab().rows = [header, ...[...data].sort((left, right) => String(left[0].value).localeCompare(String(right[0].value)))];
		};
		const first = rowEvents({ value: await newRow.run(rowContext({ store })) });
		const second = rowEvents({ value: await newRow.run(rowContext({ store })) });
		expect([...first, ...second].map((event) => event.values.A)).toEqual(['a0@x.com']);
	});

	it('New or Updated Row: an edit followed by a sort right after the read emits the edited values', async () => {
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store }));
		tab().rows[4] = cells({ values: ['d@x.com', '40'] });
		fakeGoogle.afterNextGridRead = () => {
			const [header, ...data] = tab().rows;
			tab().rows = [header, ...[...data].reverse()];
		};
		const first = rowEvents({ value: await changedRow.run(rowContext({ store })) });
		const second = rowEvents({ value: await changedRow.run(rowContext({ store })) });
		expect([...first, ...second].map((event) => [event.row, event.values.A, event.values.B])).toEqual([[5, 'd@x.com', '40']]);
	});
});
