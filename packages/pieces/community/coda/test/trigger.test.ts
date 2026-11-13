import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { newRowCreatedTrigger } from '../src/lib/triggers/new-row-created';
import { codaConnection, idsOf, memoryStore, MemoryStore, runStep, stubFetch } from './helpers';

const trigger: PollingHooks = newRowCreatedTrigger;

function row({ id, createdAt }: { id: string; createdAt: string }) {
	return { id, createdAt, name: id, values: {} };
}

function context({ store = memoryStore(), isRepublish = false }: { store?: MemoryStore; isRepublish?: boolean } = {}): HookContext {
	return { auth: codaConnection(), propsValue: { docId: 'd', tableId: 't' }, store, isRepublish };
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('new-row-created', () => {
	test('republish keeps the stored lastPoll', async () => {
		const store = memoryStore({ lastPoll: 1234 });
		await runStep(trigger.onEnable(context({ store, isRepublish: true })));
		expect(store.read('lastPoll')).toBe(1234);
	});
	test('first enable sets lastPoll to now', async () => {
		const store = memoryStore();
		await runStep(trigger.onEnable(context({ store })));
		expect(store.read('lastPoll')).toBe(Date.parse('2026-10-06T12:00:00Z'));
	});
	test('test returns the newest rows first across pages, 500 per page', async () => {
		const seen = stubFetch((request) =>
			request.query.get('pageToken')
				? { body: { items: [row({ id: 'r6', createdAt: '2026-01-06T00:00:00Z' }), row({ id: 'r7', createdAt: '2026-01-07T00:00:00Z' })] } }
				: { body: { items: ['1', '2', '3', '4', '5'].map((n) => row({ id: `r${n}`, createdAt: `2026-01-0${n}T00:00:00Z` })), nextPageToken: 'p2' } },
		);
		const result = await runStep(trigger.test(context()));
		expect(idsOf(result)).toEqual(['r7', 'r6', 'r5', 'r4', 'r3']);
		expect(seen[0].query.get('limit')).toBe('500');
		expect(seen[0].query.get('sortBy')).toBe('createdAt');
	});
	test('poll emits only rows created after lastPoll and advances it', async () => {
		const store = memoryStore({ lastPoll: Date.parse('2026-01-03T00:00:00Z') });
		stubFetch(() => ({ body: { items: [row({ id: 'old', createdAt: '2026-01-02T00:00:00Z' }), row({ id: 'same', createdAt: '2026-01-03T00:00:00Z' }), row({ id: 'new', createdAt: '2026-01-04T00:00:00Z' })] } }));
		const result = await runStep(trigger.run(context({ store })));
		expect(idsOf(result)).toEqual(['new']);
		expect(store.read('lastPoll')).toBe(Date.parse('2026-01-04T00:00:00Z'));
	});
});

type HookContext = {
	auth: ReturnType<typeof codaConnection>;
	propsValue: { docId: string; tableId: string };
	store: Store;
	isRepublish?: boolean;
};

type PollingHooks = {
	onEnable(context: HookContext): Promise<unknown>;
	test(context: HookContext): Promise<unknown>;
	run(context: HookContext): Promise<unknown>;
};
