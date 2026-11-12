import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dedupeWindow } from './support/dedupe-window';
import { rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, newRow, rowContext, tabOf } from './support/row-trigger-context';

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [tabOf({ rows: [['Ticket', 'Status'], ['T-1', 'open']] })] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1154 New or Updated Row inside the 30 s dedupe window', () => {
	it('every change seen by a separate notification starts a run, including a return to an already-delivered value', async () => {
		const { store } = memoryStore();
		const dedupe = dedupeWindow({ windowMs: 30_000 });
		await changedRow.onEnable(rowContext({ store }));
		const started: unknown[] = [];
		for (const status of ['closed', 'open', 'closed']) {
			fakeGoogle.tabs[0].rows[1] = cells({ values: ['T-1', status] });
			const out = await changedRow.run(rowContext({ store }));
			expect(rowEvents({ value: out }).map((event) => event.row)).toEqual([2]);
			started.push(...dedupe.filter({ output: out }));
			dedupe.advance({ ms: 5_000 });
		}
		expect(rowEvents({ value: started }).map((event) => event.values.B)).toEqual(['closed', 'open', 'closed']);
	});

	it('two notifications racing on the same baseline still start one run', async () => {
		const { store } = memoryStore();
		const dedupe = dedupeWindow({ windowMs: 30_000 });
		await changedRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['T-1', 'closed'] });
		const [first, second] = await Promise.all([
			changedRow.run(rowContext({ store })),
			changedRow.run(rowContext({ store, headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content,properties' } })),
		]);
		const started = [...dedupe.filter({ output: first }), ...dedupe.filter({ output: second })];
		expect(rowEvents({ value: started }).map((event) => event.row)).toEqual([2]);
	});

	it('New Row Added: a row deleted and appended again with the same values within 30 s fires again', async () => {
		const { store } = memoryStore();
		const dedupe = dedupeWindow({ windowMs: 30_000 });
		await newRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows.push(cells({ values: ['T-2', 'open'] }));
		const first = dedupe.filter({ output: await newRow.run(rowContext({ store })) });
		fakeGoogle.tabs[0].rows.pop();
		expect(dedupe.filter({ output: await newRow.run(rowContext({ store })) })).toEqual([]);
		fakeGoogle.tabs[0].rows.push(cells({ values: ['T-2', 'open'] }));
		const again = dedupe.filter({ output: await newRow.run(rowContext({ store })) });
		expect([...first, ...again].length).toBe(2);
	});
});
