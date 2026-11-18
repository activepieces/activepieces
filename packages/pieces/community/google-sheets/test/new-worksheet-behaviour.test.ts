import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newWorksheetTrigger } from '../src/lib/triggers/new-worksheet';
import { engineContext, isRecord, pollingTrigger, records } from './support/engine-context';
import { fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';

const trigger = pollingTrigger({ trigger: newWorksheetTrigger });

function ctx({ store, isRepublish }: { store: ReturnType<typeof memoryStore>['store']; isRepublish?: boolean }): Parameters<typeof trigger.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'ss1' },
			store,
			isRepublish,
			files: { write: async () => 'unused' },
		},
	});
}

async function poll({ store }: { store: ReturnType<typeof memoryStore>['store'] }) {
	const out = records({ value: await trigger.run(ctx({ store })) });
	return out.map((sheet) => titleOf({ sheet }));
}

function titleOf({ sheet }: { sheet: Record<string, unknown> }): unknown {
	const properties = sheet['properties'];
	if (!isRecord(properties)) throw new Error('worksheet without properties');
	return properties['title'];
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({
		tabs: [
			{ sheetId: 0, title: 'Sheet1', rows: [] },
			{ sheetId: 1736401234, title: 'Archive', rows: [] },
		],
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('New Worksheet behaviour', () => {
	it('fires once per new tab across polls and republish', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		expect(await poll({ store })).toEqual([]);
		fakeGoogle.tabs.push({ sheetId: 555, title: 'Q3', rows: [] });
		expect(await poll({ store })).toEqual(['Q3']);
		expect(await poll({ store })).toEqual([]);
		await trigger.onDisable(ctx({ store, isRepublish: true }));
		await trigger.onEnable(ctx({ store, isRepublish: true }));
		expect(await poll({ store })).toEqual([]);
		fakeGoogle.tabs.push({ sheetId: 777, title: 'Q4', rows: [] });
		expect(await poll({ store })).toEqual(['Q4']);
	});

	it('does not report the first tab for state saved before the fix', async () => {
		const { store } = memoryStore();
		await store.put('worksheets', JSON.stringify([1736401234]));
		expect(await poll({ store })).toEqual([]);
		expect(JSON.parse((await store.get<string>('worksheets')) ?? '[]')).toContain(0);
		fakeGoogle.tabs.push({ sheetId: 555, title: 'Q3', rows: [] });
		expect(await poll({ store })).toEqual(['Q3']);
	});
});
