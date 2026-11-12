import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook';
import { engineContext, rowEvents, webhookTrigger } from './support/engine-context';
import { cells, fakeGoogle, FakeTab, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';

const trigger = webhookTrigger({ trigger: newRowAddedTrigger });

const CHANGE = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };

function ctx({ store, sheetId = 0 }: { store: ReturnType<typeof memoryStore>['store']; sheetId?: number }): Parameters<typeof trigger.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'ss1', sheetId },
			store,
			webhookUrl: 'https://cloud.example/v1/webhooks/flow-1',
			payload: { headers: CHANGE, body: {}, queryParams: {} },
		},
	});
}

function sheet({ rows, title = 'Leads', sheetId = 0 }: { rows: (string | number)[][]; title?: string; sheetId?: number }): FakeTab {
	return { sheetId, title, rows: rows.map((values) => cells({ values })) };
}

function tab(): FakeTab {
	return fakeGoogle.tabs[0];
}

async function fire({ store, sheetId }: { store: ReturnType<typeof memoryStore>['store']; sheetId?: number }) {
	const out = rowEvents({ value: await trigger.run(ctx({ store, sheetId })) });
	return out.map((event) => `${event.row}:${event.values.A}`);
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [sheet({ rows: [['Name', 'Email'], ['Ann', 'ann@x.io'], ['Bob', 'bob@x.io'], ['Cat', 'cat@x.io']] })] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('New Row Added behaviour', () => {
	it('fires once per appended row across notifications and republish', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		expect(await fire({ store })).toEqual([]);
		tab().rows.push(cells({ values: ['Dan', 'dan@x.io'] }), cells({ values: ['Eve', 'eve@x.io'] }));
		expect(await fire({ store })).toEqual(['5:Dan', '6:Eve']);
		expect(await fire({ store })).toEqual([]);
		await trigger.onDisable(ctx({ store }));
		await trigger.onEnable(ctx({ store }));
		expect(await fire({ store })).toEqual([]);
	});

	it('does not fire for a row inserted at the top', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		tab().rows.splice(1, 0, cells({ values: ['Zed', 'zed@x.io'] }));
		expect(await fire({ store })).toEqual([]);
	});

	it('fires only the appended row when an old row was deleted in the same notification', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		tab().rows.splice(1, 1);
		tab().rows.push(cells({ values: ['Dan', 'dan@x.io'] }));
		expect(await fire({ store })).toEqual(['4:Dan']);
	});

	it('does not fire on sort or when the last row is edited', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const [header, ...data] = tab().rows;
		tab().rows = [header, ...[...data].reverse()];
		expect(await fire({ store })).toEqual([]);
		tab().rows[3] = cells({ values: ['Ann', 'ann@new.io'] });
		expect(await fire({ store })).toEqual([]);
	});

	it('does not fire for an existing row edited and moved to the bottom, but still fires a real append after it', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const [header, ann, bob, cat] = tab().rows;
		tab().rows = [header, bob, cat, [ann[0], { value: 'ann@new.io' }]];
		expect(await fire({ store })).toEqual([]);
		tab().rows.push(cells({ values: ['Dan', 'dan@x.io'] }));
		expect(await fire({ store })).toEqual(['5:Dan']);
	});

	it('does not fire when a row next to a blank row is deleted, and still fires a later append', async () => {
		resetFakeGoogle({ tabs: [sheet({ rows: [['Name', 'Email'], ['Zed', 'zed@x.io'], [], ['Carol', 'carol@x.io']] })] });
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		tab().rows.splice(1, 1);
		expect(await fire({ store })).toEqual([]);
		tab().rows.push(cells({ values: ['Dan', 'dan@x.io'] }));
		expect(await fire({ store })).toEqual(['4:Dan']);
	});

	it('uses the stored row count once after an upgrade, then the new rule', async () => {
		const { store, data } = memoryStore();
		await store.put('0', 4);
		tab().rows.push(cells({ values: ['Dan', 'dan@x.io'] }));
		expect(await fire({ store })).toEqual(['5:Dan']);
		expect(data.has('0')).toBe(false);
		tab().rows.splice(1, 0, cells({ values: ['Zed', 'zed@x.io'] }));
		expect(await fire({ store })).toEqual([]);
	});

	it('works on a tab named Q1', async () => {
		resetFakeGoogle({
			tabs: [sheet({ rows: [['Quarter'], ['Q1']], title: 'Summary' }), sheet({ rows: [['Name'], ['Ann']], title: 'Q1', sheetId: 9 })],
		});
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store, sheetId: 9 }));
		fakeGoogle.tabs[1].rows.push(cells({ values: ['Bob'] }));
		expect(await fire({ store, sheetId: 9 })).toEqual(['3:Bob']);
	});

	it('test() returns the newest data rows without the header', async () => {
		const { store } = memoryStore();
		const sample = rowEvents({ value: await trigger.test(ctx({ store })) });
		expect(sample.map((row) => row.values.A)).toEqual(['Cat', 'Bob', 'Ann']);
	});
});
