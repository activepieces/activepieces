import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rowEvents } from './support/engine-context';
import { cells, fakeGoogle, installFakeGoogle, memoryStore, resetFakeGoogle } from './support/fake-google';
import { changedRow, newRow, rowContext, tabOf } from './support/row-trigger-context';

function notification({ changed }: { changed: string }): Record<string, string> {
	return { 'x-goog-resource-state': 'update', 'x-goog-changed': changed, 'x-goog-message-number': '7' };
}

beforeEach(() => {
	installFakeGoogle();
	resetFakeGoogle({ tabs: [tabOf({ rows: [['Name', 'Status'], ['alice', 'new']] })] });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('PIE-1112 X-Goog-Changed is a comma-separated list', () => {
	it.each(['content, permissions', 'permissions,content', ' Content ', 'content,properties', 'properties'])(
		'New Row Added: a row added in a notification listing "%s" starts the flow',
		async (changed) => {
			const { store } = memoryStore();
			await newRow.onEnable(rowContext({ store }));
			fakeGoogle.tabs[0].rows.push(cells({ values: ['bob', 'new'] }));
			const out = rowEvents({ value: await newRow.run(rowContext({ store, headers: notification({ changed }) })) });
			expect(out.map((event) => event.row)).toEqual([3]);
		},
	);

	it('New or Updated Row: an edit in a notification listing "content, permissions" starts the flow', async () => {
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['alice', 'done'] });
		const out = rowEvents({ value: await changedRow.run(rowContext({ store, headers: notification({ changed: 'content, permissions' }) })) });
		expect(out.map((event) => event.row)).toEqual([2]);
	});

	it.each(['permissions', 'parents, children', ''])('a notification listing only "%s" does not read the sheet', async (changed) => {
		const { store } = memoryStore();
		await changedRow.onEnable(rowContext({ store }));
		fakeGoogle.tabs[0].rows[1] = cells({ values: ['alice', 'done'] });
		fakeGoogle.gridReads = [];
		expect(await changedRow.run(rowContext({ store, headers: notification({ changed }) }))).toEqual([]);
		expect(fakeGoogle.gridReads).toEqual([]);
	});
});
