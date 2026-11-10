import { afterEach, describe, expect, test, vi } from 'vitest';
import { newRecord } from '../src/lib/triggers/new-record';
import { updatedRecord } from '../src/lib/triggers/updated-record';
import { AUTH, memoryStore, MemoryStore, SeenRequest, stubFetch } from './helpers';

const TABLE = { id: 't1', name: 'T', structure: [{ slug: 'title', label: 'Title', field_type: 'recordtitlefield', params: {} }] };

type Hooks = {
	onEnable(c: unknown): Promise<unknown>;
	onDisable(c: unknown): Promise<unknown>;
	run(c: unknown): Promise<unknown[]>;
	test(c: unknown): Promise<unknown[]>;
};
const hooks: Hooks = newRecord;
const updatedHooks: Hooks = updatedRecord;

function ctx({ store, body }: { store: MemoryStore; body?: unknown }) {
	return { auth: AUTH, propsValue: { solutionId: 's1', tableId: 't1' }, store, webhookUrl: 'https://hook.example/x', payload: { body } };
}

function event({ id, recordId }: { id: string; recordId: string }) {
	return { event_id: id, record_event_data: { data: { id: recordId, title: `rec ${recordId}` } } };
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('webhook triggers', () => {
	test('onEnable creates the webhook for the table and stores its id', async () => {
		const seen = stubFetch(() => ({ body: { webhook: { webhook_id: 'w1' } } }));
		const store = memoryStore();
		await hooks.onEnable(ctx({ store }));
		expect(seen[0].path).toContain('/CreateWebhook');
		expect(seen[0].body).toMatchObject({ webhook: { kinds: ['RECORD_CREATED'], filter: { applications: { application_ids: ['t1'] } }, notification_status: { enabled: { url: 'https://hook.example/x' } } } });
		expect(store.snapshot()['new_record']).toBe('w1');
	});
	test('onEnable deletes the webhook when storing its id fails', async () => {
		const seen = stubFetch(() => ({ body: { webhook: { webhook_id: 'w1' } } }));
		const store = memoryStore();
		store.put = async () => { throw new Error('store down'); };
		await expect(hooks.onEnable(ctx({ store }))).rejects.toThrow('store down');
		expect(seen[1].path).toContain('/DeleteWebhook');
		expect(seen[1].body).toEqual({ webhook_id: 'w1' });
	});
	test('onDisable treats 404 as already deleted and clears the store', async () => {
		stubFetch(() => ({ status: 404, body: { code: 'not_found', msg: 'webhook not found' } }));
		const store = memoryStore({ new_record: 'w1', pageToken: 'p', seenEventIds: ['a'] });
		await expect(hooks.onDisable(ctx({ store }))).resolves.toBeUndefined();
		expect(store.snapshot()).toEqual({});
	});
	test('onDisable keeps the id when delete fails for another reason', async () => {
		stubFetch(() => ({ status: 500, body: {} }));
		const store = memoryStore({ new_record: 'w1' });
		await expect(hooks.onDisable(ctx({ store }))).rejects.toThrow();
		expect(store.snapshot()['new_record']).toBe('w1');
	});
	test('run stops when the last page has events and an empty token (no restart from the first event)', async () => {
		const seen = stubFetch((request: SeenRequest) => {
			if (request.path.includes('ListEvents')) {
				return { body: { events: [event({ id: 'e1', recordId: 'r1' })], next_page_token: '' } };
			}
			return { body: TABLE };
		});
		const store = memoryStore({ new_record: 'w1', pageToken: 'p0' });
		const result = await hooks.run(ctx({ store, body: { webhookId: 'w1', locator: {} } }));
		expect(result).toEqual([{ id: 'r1', Title: 'rec r1', _dedupe_key: 'smartsuite:e1' }]);
		expect(seen.filter((r) => r.path.includes('ListEvents'))).toHaveLength(1);
		expect(store.snapshot()['pageToken']).toBe('p0');
	});
	test('run follows tokens, caps pages and never loops forever', async () => {
		let n = 0;
		stubFetch((request: SeenRequest) => {
			if (request.path.includes('ListEvents')) {
				n++;
				return { body: { events: [event({ id: `e${n}`, recordId: `r${n}` })], next_page_token: `p${n}` } };
			}
			return { body: TABLE };
		});
		const store = memoryStore({ new_record: 'w1' });
		const result = await hooks.run(ctx({ store, body: { webhookId: 'w1' } }));
		expect(n).toBe(20);
		expect(result).toHaveLength(20);
		expect(store.snapshot()['pageToken']).toBe('p20');
	});
	test('run drops events already emitted (dedupe by event id) and bounds the seen list', async () => {
		stubFetch((request: SeenRequest) =>
			request.path.includes('ListEvents') ? { body: { events: [event({ id: 'e1', recordId: 'r1' }), event({ id: 'e2', recordId: 'r2' })] } } : { body: TABLE },
		);
		const store = memoryStore({ new_record: 'w1', seenEventIds: ['e1'] });
		const result = await hooks.run(ctx({ store, body: { webhookId: 'w1' } }));
		expect(result).toEqual([{ id: 'r2', Title: 'rec r2', _dedupe_key: 'smartsuite:e2' }]);
		expect(store.snapshot()['seenEventIds']).toEqual(['e1', 'e2']);
	});
	test('overlapping runs both deliver, and each event carries one dedupe key so the platform starts one run per event', async () => {
		stubFetch((request: SeenRequest) =>
			request.path.includes('ListEvents') ? { body: { events: [event({ id: 'e1', recordId: 'r1' }), event({ id: 'e2', recordId: 'r2' })], next_page_token: 'p1' } } : { body: TABLE },
		);
		const store = memoryStore({ new_record: 'w1' });
		const [first, second] = await Promise.all([
			hooks.run(ctx({ store, body: { webhookId: 'w1' } })),
			hooks.run(ctx({ store, body: { webhookId: 'w1' } })),
		]);
		expect(first).toHaveLength(2);
		const keys = [...first, ...second].map((payload) => (typeof payload === 'object' && payload !== null && '_dedupe_key' in payload ? payload['_dedupe_key'] : undefined));
		expect(new Set(keys)).toEqual(new Set(['smartsuite:e1', 'smartsuite:e2']));
		expect(store.snapshot()['pageToken']).toBe('p1');
		expect(store.snapshot()['seenEventIds']).toEqual(['e1', 'e2']);
	});
	test('the seen list keeps IDs another run stored while this run was reading', async () => {
		const store = memoryStore({ new_record: 'w1', seenEventIds: ['e0'] });
		stubFetch((request: SeenRequest) => {
			if (request.path.includes('ListEvents')) {
				void store.put('seenEventIds', ['e0', 'e9']);
				return { body: { events: [event({ id: 'e1', recordId: 'r1' })] } };
			}
			return { body: TABLE };
		});
		await expect(hooks.run(ctx({ store, body: { webhookId: 'w1' } }))).resolves.toHaveLength(1);
		expect(store.snapshot()['seenEventIds']).toEqual(['e0', 'e9', 'e1']);
	});
	test('a notification is never answered empty because of state left by an earlier run', async () => {
		stubFetch((request: SeenRequest) =>
			request.path.includes('ListEvents') ? { body: { events: [event({ id: 'e1', recordId: 'r1' })] } } : { body: TABLE },
		);
		const store = memoryStore({ new_record: 'w1', pullClaim: { owner: 'crashed', at: Date.now() } });
		await expect(hooks.run(ctx({ store, body: { webhookId: 'w1' } }))).resolves.toEqual([{ id: 'r1', Title: 'rec r1', _dedupe_key: 'smartsuite:e1' }]);
	});
	test('run stops paging at its 15 s budget, pings its own webhook URL to continue, and the next run resumes from the stored cursor', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		const pageTokens: unknown[] = [];
		let n = 0;
		const seen = stubFetch((request: SeenRequest) => {
			if (request.url.startsWith('https://hook.example/')) return { body: {} };
			if (!request.path.includes('ListEvents')) return { body: TABLE };
			pageTokens.push(typeof request.body === 'object' && request.body !== null && 'page_token' in request.body ? request.body['page_token'] : undefined);
			vi.setSystemTime(Date.now() + 7_000);
			n++;
			return { body: { events: [event({ id: `e${n}`, recordId: `r${n}` })], next_page_token: `${100 + n}` } };
		});
		const store = memoryStore({ new_record: 'w1', pageToken: '100' });
		const started = Date.now();
		const first = await hooks.run(ctx({ store, body: { webhookId: 'w1' } }));
		expect(first).toHaveLength(2);
		expect(pageTokens).toEqual(['100', '101']);
		expect(Date.now() - started).toBeLessThan(20_000);
		expect(store.snapshot()['pageToken']).toBe('102');
		const pings = seen.filter((r) => r.url.startsWith('https://hook.example/'));
		expect(pings).toHaveLength(1);
		expect(pings[0]).toMatchObject({ method: 'POST', body: { webhookId: 'w1', continuation: true } });
		const second = await hooks.run(ctx({ store, body: pings[0].body }));
		expect(pageTokens[2]).toBe('102');
		expect(second.map((payload) => (typeof payload === 'object' && payload !== null && 'id' in payload ? payload['id'] : undefined))).toEqual(['r3', 'r4']);
		vi.useRealTimers();
	});
	test('if the continuation ping fails the run fails and the cursor stays put', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		stubFetch((request: SeenRequest) => {
			if (request.url.startsWith('https://hook.example/')) return { status: 500, body: {} };
			if (!request.path.includes('ListEvents')) return { body: TABLE };
			vi.setSystemTime(Date.now() + 7_000);
			return { body: { events: [event({ id: `e${Date.now()}`, recordId: 'r' })], next_page_token: `${Date.now()}` } };
		});
		const store = memoryStore({ new_record: 'w1', pageToken: '100' });
		await expect(hooks.run(ctx({ store, body: { webhookId: 'w1' } }))).rejects.toThrow();
		expect(store.snapshot()['pageToken']).toBe('100');
		expect(store.snapshot()['seenEventIds']).toBeUndefined();
		vi.useRealTimers();
	});
	test('events another run recorded while this run was fetching are not emitted again', async () => {
		const store = memoryStore({ new_record: 'w1' });
		stubFetch((request: SeenRequest) => {
			if (request.path.includes('ListEvents')) {
				void store.put('seenEventIds', ['e1']);
				return { body: { events: [event({ id: 'e1', recordId: 'r1' }), event({ id: 'e2', recordId: 'r2' })] } };
			}
			return { body: TABLE };
		});
		await expect(hooks.run(ctx({ store, body: { webhookId: 'w1' } }))).resolves.toEqual([{ id: 'r2', Title: 'rec r2', _dedupe_key: 'smartsuite:e2' }]);
		expect(store.snapshot()['seenEventIds']).toEqual(['e1', 'e2']);
	});
	test.each([
		{ format: 'numeric', start: '100', other: '120', mine: '110' },
		{ format: 'opaque', start: 'tokA', other: 'tokC', mine: 'tokB' },
	])('an older run finishing last never moves the cursor back ($format tokens)', async ({ start, other, mine }) => {
		const store = memoryStore({ new_record: 'w1', pageToken: start });
		stubFetch((request: SeenRequest) => {
			if (request.path.includes('ListEvents')) {
				void store.put('pageToken', other);
				return { body: { events: [event({ id: 'e1', recordId: 'r1' })], next_page_token: mine } };
			}
			return { body: TABLE };
		});
		await hooks.run(ctx({ store, body: { webhookId: 'w1' } }));
		expect(store.snapshot()['pageToken']).toBe(other);
	});
	test('a run that started from the stored cursor advances it with any token format', async () => {
		const store = memoryStore({ new_record: 'w1', pageToken: 'tokA' });
		stubFetch((request: SeenRequest) =>
			request.path.includes('ListEvents') ? { body: { events: [event({ id: 'e1', recordId: 'r1' })], next_page_token: 'tokB' } } : { body: TABLE },
		);
		await hooks.run(ctx({ store, body: { webhookId: 'w1' } }));
		expect(store.snapshot()['pageToken']).toBe('tokB');
	});

	test('run ignores notifications for another webhook', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		const store = memoryStore({ new_record: 'w1' });
		await expect(hooks.run(ctx({ store, body: { webhookId: 'other' } }))).resolves.toEqual([]);
		expect(seen).toHaveLength(0);
	});
	test('test returns the newest records first', async () => {
		const seen = stubFetch((request: SeenRequest) => (request.path.endsWith('/records/list/') ? { body: { items: [{ id: 'r9', title: 'x' }], total: 1 } } : { body: TABLE }));
		await expect(hooks.test(ctx({ store: memoryStore() }))).resolves.toEqual([{ id: 'r9', Title: 'x' }]);
		const list = seen.find((r) => r.path.endsWith('/records/list/'));
		expect(list?.body).toEqual({ sort: [{ field: 'first_created', direction: 'desc' }] });
		expect(list?.query.get('limit')).toBe('5');
	});
	test('updated_record subscribes to RECORD_UPDATED', async () => {
		const seen = stubFetch(() => ({ body: { webhook: { webhook_id: 'w2' } } }));
		const store = memoryStore();
		await updatedHooks.onEnable(ctx({ store }));
		expect(seen[0].body).toMatchObject({ webhook: { kinds: ['RECORD_UPDATED'] } });
		expect(store.snapshot()['updated_record']).toBe('w2');
	});
});
