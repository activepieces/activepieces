import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger';
import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook';
import { engineContext, rowEvents, webhookTrigger } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';

const rowAdded = webhookTrigger({ trigger: newRowAddedTrigger });
const newOrUpdated = webhookTrigger({ trigger: newOrUpdatedRowTrigger });

const CHANGE = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };

function ctx<T>({ store, isRepublish }: { store: ReturnType<typeof memoryStore>['store']; isRepublish?: boolean }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'ss1', sheetId: 0, trigger_column: 'all_columns' },
			store,
			isRepublish,
			webhookUrl: 'https://cloud.example/v1/webhooks/flow-1',
			payload: { headers: CHANGE, body: {}, queryParams: {} },
		},
	});
}

function rows(): ReturnType<typeof cells>[] {
	return fakeGoogle.tabs[0].rows;
}

async function fired({ value }: { value: unknown }): Promise<number[]> {
	return rowEvents({ value: await value }).map((event) => event.row);
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({
		tabs: [{ sheetId: 0, title: 'Orders', rows: [cells({ values: ['Email', 'Status'] }), cells({ values: ['a@x.com', 'new'] }), cells({ values: ['b@x.com', 'new'] })] }],
	});
	vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Google Sheets row triggers on republish', () => {
	it('New Row Added keeps its snapshot, so a row added just before the republish still fires', async () => {
		const { store } = memoryStore();
		await rowAdded.onEnable(ctx({ store }));

		rows().push(cells({ values: ['c@x.com', 'new'] }));
		await rowAdded.onDisable(ctx({ store }));
		await rowAdded.onEnable(ctx({ store, isRepublish: true }));
		rows().push(cells({ values: ['d@x.com', 'new'] }));

		expect(await fired({ value: rowAdded.run(ctx({ store })) })).toEqual([4, 5]);
	});

	it('New Row Added starts from the current rows when the flow is turned off and on', async () => {
		const { store } = memoryStore();
		await rowAdded.onEnable(ctx({ store }));

		rows().push(cells({ values: ['c@x.com', 'new'] }));
		await rowAdded.onDisable(ctx({ store }));
		await rowAdded.onEnable(ctx({ store }));

		expect(await fired({ value: rowAdded.run(ctx({ store })) })).toEqual([]);
	});

	it('New or Updated Row keeps its snapshot, so a row edited just before the republish still fires', async () => {
		const { store } = memoryStore();
		await newOrUpdated.onEnable(ctx({ store }));

		rows()[1] = cells({ values: ['a@x.com', 'paid'] });
		await newOrUpdated.onDisable(ctx({ store }));
		await newOrUpdated.onEnable(ctx({ store, isRepublish: true }));
		rows()[2] = cells({ values: ['b@x.com', 'paid'] });

		expect(await fired({ value: newOrUpdated.run(ctx({ store })) })).toEqual([2, 3]);
	});

	it.each([
		{ name: 'New Row Added', trigger: rowAdded },
		{ name: 'New or Updated Row', trigger: newOrUpdated },
	])('$name still fails the republish when the worksheet was deleted', async ({ trigger }) => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));

		fakeGoogle.tabs.splice(0, 1);
		await trigger.onDisable(ctx({ store }));

		await expect(trigger.onEnable(ctx({ store, isRepublish: true }))).rejects.toThrow();
	});

	it('New or Updated Row starts from the current rows when the flow is turned off and on', async () => {
		const { store } = memoryStore();
		await newOrUpdated.onEnable(ctx({ store }));

		rows()[1] = cells({ values: ['a@x.com', 'paid'] });
		await newOrUpdated.onDisable(ctx({ store }));
		await newOrUpdated.onEnable(ctx({ store }));

		expect(await fired({ value: newOrUpdated.run(ctx({ store })) })).toEqual([]);
	});
});
