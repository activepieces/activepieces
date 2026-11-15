import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger';
import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook';
import { engineContext, rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';

const cases = [
	{ name: 'New Row Added', trigger: newRowAddedTrigger, channelKey: 'googlesheets_new_row_added' },
	{ name: 'New or Updated Row', trigger: newOrUpdatedRowTrigger, channelKey: 'google-sheets-new-or-updated-row' },
];

function ctx<T>({ store, headers = {} }: { store: ReturnType<typeof memoryStore>['store']; headers?: Record<string, string> }): T {
	return engineContext({
		context: {
			auth: { type: 'OAUTH2', access_token: 'tok', props: {}, data: {} },
			propsValue: { includeTeamDrives: false, spreadsheetId: 'ss1', sheetId: 0, trigger_column: 'all_columns' },
			store,
			webhookUrl: 'https://cloud.example/v1/webhooks/flow-1',
			payload: { headers, body: {}, queryParams: {} },
		},
	});
}

async function storedChannelId({ store, key }: { store: ReturnType<typeof memoryStore>['store']; key: string }) {
	return (await store.get<{ id: string }>(key))?.id;
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [{ sheetId: 0, title: 'Sheet1', rows: [cells({ values: ['Name'] }), cells({ values: ['Ann'] })] }] });
	vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe.each(cases)('$name channel lifecycle', ({ trigger, channelKey }) => {
	it('renew stores the new channel and then stops the old one', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const first = await storedChannelId({ store, key: channelKey });
		await trigger.onRenew!(ctx({ store }));
		const second = await storedChannelId({ store, key: channelKey });
		expect(second).not.toBe(first);
		expect([...fakeGoogle.liveChannels]).toEqual([second]);
	});

	it('keeps the old channel when creating the new one fails, and the next renew works', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const first = await storedChannelId({ store, key: channelKey });
		fakeGoogle.failNextWatch = true;
		await expect(trigger.onRenew!(ctx({ store }))).rejects.toThrow('Backend Error');
		expect(await storedChannelId({ store, key: channelKey })).toBe(first);
		expect([...fakeGoogle.liveChannels]).toEqual([first]);
		await trigger.onRenew!(ctx({ store }));
		expect(fakeGoogle.liveChannels.size).toBe(1);
	});

	it('stops the new channel and rethrows when saving it fails during renew', async () => {
		const { store, failPuts } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		const first = await storedChannelId({ store, key: channelKey });
		failPuts.matching = new RegExp(`^${channelKey}$`);
		await expect(trigger.onRenew!(ctx({ store }))).rejects.toThrow(/StorageError/);
		expect([...fakeGoogle.liveChannels]).toEqual([first]);
	});

	it('keeps the new channel when stopping the old one fails', async () => {
		const { store } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		fakeGoogle.failNextStop = true;
		await trigger.onRenew!(ctx({ store }));
		const second = await storedChannelId({ store, key: channelKey });
		expect(fakeGoogle.liveChannels.has(second ?? '')).toBe(true);
		expect(console.warn).toHaveBeenCalled();
	});

	it('stops the channel it created when saving it fails during enable', async () => {
		const { store, failPuts } = memoryStore();
		failPuts.matching = new RegExp(`^${channelKey}$`);
		await expect(trigger.onEnable(ctx({ store }))).rejects.toThrow(/StorageError/);
		expect(fakeGoogle.watchCount).toBe(1);
		expect(fakeGoogle.liveChannels.size).toBe(0);
	});

	it('ignores a notification from a channel that is not the stored one and leaves state untouched', async () => {
		const { store, data } = memoryStore();
		await trigger.onEnable(ctx({ store }));
		fakeGoogle.tabs[0].rows.push(cells({ values: ['Bob'] }));
		const before = JSON.stringify([...data.entries()]);
		const foreign = await trigger.run(
			ctx({ store, headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content', 'x-goog-channel-id': 'leaked-channel' } }),
		);
		expect(foreign).toEqual([]);
		expect(JSON.stringify([...data.entries()])).toBe(before);
		const current = await storedChannelId({ store, key: channelKey });
		const own = rowEvents({
			value: await trigger.run(
				ctx({ store, headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content', 'x-goog-channel-id': current ?? '' } }),
			),
		});
		expect(own.map((event) => event.row)).toEqual([3]);
	});
});
