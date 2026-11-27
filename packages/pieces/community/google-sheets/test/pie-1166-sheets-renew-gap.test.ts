import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rowEvents, RowEvent } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, newRow, rowContext, tabOf, TestStore } from './support/row-trigger-context';

const outbox: Record<string, string>[] = [];

function channels() {
	return [...fakeGoogle.liveChannels];
}

function editSheet({ edit }: { edit: () => void }) {
	edit();
	for (const id of channels()) {
		outbox.push({ 'x-goog-resource-state': 'update', 'x-goog-changed': 'content', 'x-goog-channel-id': id });
	}
}

function syncFor({ id }: { id: string }) {
	outbox.push({ 'x-goog-resource-state': 'sync', 'x-goog-channel-id': id });
}

async function currentChannel({ store, key }: { store: TestStore; key: string }): Promise<string> {
	return (await store.get<{ id: string }>(key))?.id ?? '';
}

const cases = [
	{
		name: 'New Row Added',
		trigger: newRow,
		key: 'googlesheets_new_row_added',
		edit: () => fakeGoogle.tabs[0].rows.push(cells({ values: ['c@x.com', '3'] })),
		expected: ['4:c@x.com'],
	},
	{
		name: 'New or Updated Row',
		trigger: changedRow,
		key: 'google-sheets-new-or-updated-row',
		edit: () => {
			fakeGoogle.tabs[0].rows[2] = cells({ values: ['b@x.com', 'paid'] });
		},
		expected: ['3:b@x.com'],
	},
];

async function deliverAll({ trigger, store }: { trigger: typeof newRow; store: TestStore }): Promise<RowEvent[]> {
	const delivered: RowEvent[] = [];
	while (outbox.length > 0) {
		const headers = outbox.shift() ?? {};
		delivered.push(...rowEvents({ value: await trigger.run(rowContext({ store, headers })) }));
	}
	return delivered;
}

function labels({ events }: { events: RowEvent[] }): string[] {
	return events.map((event) => `${event.row}:${String(event.values.A)}`);
}

beforeEach(() => {
	outbox.length = 0;
	installFakeGoogle();
	resetFakeGoogle({ tabs: [tabOf({ rows: [['Email', 'Status'], ['a@x.com', 'new'], ['b@x.com', 'new']] })] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1166 a change made while the Drive watch is renewed is delivered once', () => {
	it.each(cases)('$name: the first enable fires nothing, even on its sync message', async ({ trigger, key }) => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		syncFor({ id: await currentChannel({ store, key }) });
		expect(await deliverAll({ trigger, store })).toEqual([]);
	});

	it.each(cases)('$name: a change made during the renew fires once afterwards', async ({ trigger, key, edit, expected }) => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		syncFor({ id: await currentChannel({ store, key }) });
		expect(await deliverAll({ trigger, store })).toEqual([]);

		fakeGoogle.beforeNextWatch = () => editSheet({ edit });
		const renew = trigger.onRenew;
		if (!renew) throw new Error('expected onRenew');
		await renew(rowContext({ store }));
		syncFor({ id: await currentChannel({ store, key }) });

		expect(labels({ events: await deliverAll({ trigger, store }) })).toEqual(expected);
	});

	it.each(cases)('$name: a change whose only notification is the new channel sync fires on that sync', async ({ trigger, key, edit, expected }) => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		fakeGoogle.beforeNextWatch = () => {
			edit();
		};
		const renew = trigger.onRenew;
		if (!renew) throw new Error('expected onRenew');
		await renew(rowContext({ store }));
		syncFor({ id: await currentChannel({ store, key }) });
		expect(labels({ events: await deliverAll({ trigger, store }) })).toEqual(expected);
	});

	it.each(cases)('$name: notifications from an unknown channel, or from the replaced one after it expired, are ignored', async ({ trigger, key, edit }) => {
		const { store } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		const oldId = await currentChannel({ store, key });
		const renew = trigger.onRenew;
		if (!renew) throw new Error('expected onRenew');
		await renew(rowContext({ store }));
		edit();
		fakeGoogle.gridReads = [];
		const change = { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' };
		expect(await trigger.run(rowContext({ store, headers: { ...change, 'x-goog-channel-id': 'someone-else' } }))).toEqual([]);
		const later = Date.now() + 8 * 24 * 60 * 60 * 1000;
		vi.spyOn(Date, 'now').mockReturnValue(later);
		expect(await trigger.run(rowContext({ store, headers: { ...change, 'x-goog-channel-id': oldId } }))).toEqual([]);
		expect(fakeGoogle.gridReads).toEqual([]);
	});

	it.each(cases)('$name: disabling clears the replaced channel too', async ({ trigger, key }) => {
		const { store, data } = memoryStore();
		await trigger.onEnable(rowContext({ store }));
		const renew = trigger.onRenew;
		if (!renew) throw new Error('expected onRenew');
		await renew(rowContext({ store }));
		expect(data.has(`${key}_previous`)).toBe(true);
		await trigger.onDisable(rowContext({ store }));
		expect([data.has(key), data.has(`${key}_previous`)]).toEqual([false, false]);
	});
});
