import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newWorksheetTrigger } from '../src/lib/triggers/new-worksheet';
import { engineContext, pollingTrigger, records } from './support/engine-context';
import { fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';

const trigger = pollingTrigger({ trigger: newWorksheetTrigger });

function ctx({ store }: { store: ReturnType<typeof memoryStore>['store'] }): Parameters<typeof trigger.run>[0] {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { spreadsheetId: 'sheet-1', includeTeamDrives: false },
			store,
			files: { write: async () => 'unused' },
		},
	});
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [{ sheetId: 111, title: 'Orders', rows: [] }, { sheetId: 222, title: 'Customers', rows: [] }] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1118 New Worksheet poll racing the disable hook', () => {
	it('a poll that runs after onDisable does not report existing tabs as new', async () => {
		vi.spyOn(console, 'info').mockImplementation(() => undefined);
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		expect(await trigger.run(ctx({ store }))).toEqual([]);
		await trigger.onDisable(ctx({ store }));
		expect(await trigger.run(ctx({ store }))).toEqual([]);
	});

	it('after that baseline, a tab added later still fires once', async () => {
		vi.spyOn(console, 'info').mockImplementation(() => undefined);
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		await trigger.onDisable(ctx({ store }));
		expect(await trigger.run(ctx({ store }))).toEqual([]);
		fakeGoogle.tabs.push({ sheetId: 333, title: 'Returns', rows: [] });
		expect(records({ value: await trigger.run(ctx({ store })) }).length).toBe(1);
		expect(await trigger.run(ctx({ store }))).toEqual([]);
	});
});
