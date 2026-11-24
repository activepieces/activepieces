import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger';
import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook';
import { dedupeWindow } from './support/dedupe-window';
import { engineContext, rowEvents, webhookTrigger } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';

const newRow = webhookTrigger({ trigger: newRowAddedTrigger });
const changedRow = webhookTrigger({ trigger: newOrUpdatedRowTrigger });
const CHANGE = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };

type Store = ReturnType<typeof memoryStore>['store'];

function ctx({ store }: { store: Store }): Parameters<typeof newRow.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'token', props: {}, data: {} },
			propsValue: { spreadsheetId: 'sp1', sheetId: 7, includeTeamDrives: false, trigger_column: 'all_columns' },
			store,
			webhookUrl: 'https://example.com/api/v1/webhooks/flow1',
			payload: { headers: CHANGE, body: {}, queryParams: {} },
		},
	});
}

async function until({ condition }: { condition: () => boolean }): Promise<void> {
	for (let attempt = 0; attempt < 1000 && !condition(); attempt++) {
		await new Promise((resolve) => setImmediate(resolve));
	}
	if (!condition()) throw new Error('condition not reached');
}

function hold(): { release: () => void } {
	const gate = { release: () => undefined };
	fakeGoogle.holdNextGridRead = new Promise<void>((resolve) => {
		gate.release = () => resolve();
	});
	return gate;
}

function rowsOf({ output }: { output: unknown }): number[] {
	return rowEvents({ value: output }).map((event) => event.row);
}

const triggers = [
	{ name: 'New Row Added', trigger: newRow },
	{ name: 'New or Updated Row', trigger: changedRow },
];

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [{ sheetId: 7, title: 'Orders', rows: [['Email', 'Amount'], ['a@x.com', '1'], ['b@x.com', '2']].map((values) => cells({ values })) }] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1157 overlapping notifications fire each appended row once', () => {
	it.each(triggers)('$name: the run with the older read finishing last does not make a later notification replay a row', async ({ trigger }) => {
		const { store } = memoryStore();
		const dedupe = dedupeWindow({ windowMs: 30_000 });
		await trigger.onEnable(ctx({ store }));

		fakeGoogle.tabs[0].rows.push(cells({ values: ['c@x.com', '3'] }));
		let release: () => void = () => undefined;
		fakeGoogle.holdNextGridRead = new Promise<void>((resolve) => {
			release = resolve;
		});
		const runA = trigger.run(ctx({ store }));
		await until({ condition: () => fakeGoogle.heldGridReads === 1 });

		fakeGoogle.tabs[0].rows.push(cells({ values: ['d@x.com', '4'] }));
		const outB = dedupe.filter({ output: await trigger.run(ctx({ store })) });
		release();
		const outA = dedupe.filter({ output: await runA });

		dedupe.advance({ ms: 5 * 60_000 });
		fakeGoogle.tabs[0].rows.push(cells({ values: ['e@x.com', '5'] }));
		const outC = dedupe.filter({ output: await trigger.run(ctx({ store })) });

		expect([...rowsOf({ output: outA }), ...rowsOf({ output: outB }), ...rowsOf({ output: outC })].sort()).toEqual([4, 5, 6]);
	});

	it.each(triggers)('$name: the run with the older read finishing first does not make a later notification replay a row', async ({ trigger }) => {
		const { store } = memoryStore();
		const dedupe = dedupeWindow({ windowMs: 30_000 });
		await trigger.onEnable(ctx({ store }));

		fakeGoogle.tabs[0].rows.push(cells({ values: ['c@x.com', '3'] }));
		const holdA = hold();
		const runA = trigger.run(ctx({ store }));
		await until({ condition: () => fakeGoogle.heldGridReads === 1 });
		fakeGoogle.tabs[0].rows.push(cells({ values: ['d@x.com', '4'] }));
		const holdB = hold();
		const runB = trigger.run(ctx({ store }));
		await until({ condition: () => fakeGoogle.heldGridReads === 2 });

		holdA.release();
		const outA = dedupe.filter({ output: await runA });
		holdB.release();
		const outB = dedupe.filter({ output: await runB });

		dedupe.advance({ ms: 5 * 60_000 });
		fakeGoogle.tabs[0].rows.push(cells({ values: ['e@x.com', '5'] }));
		const outC = dedupe.filter({ output: await trigger.run(ctx({ store })) });

		expect([...rowsOf({ output: outA }), ...rowsOf({ output: outB }), ...rowsOf({ output: outC })].sort()).toEqual([4, 5, 6]);
	});
});
