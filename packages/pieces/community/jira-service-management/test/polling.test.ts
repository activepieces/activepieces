import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { PollingState, newRequestPolling } from '../src/lib/common/polling';

const MINUTE = 60_000;
const T0 = Date.parse('2026-11-13T18:00:00.000+0000');

function issue({ id, created }: { id: string; created: string }) {
	return { id, key: `SD-${id}`, fields: { created } };
}

describe('newRequestPolling.initialState', () => {
	it('starts just before the current second, so a request created right after enabling is not lost when Jira rounds to the second', () => {
		const enabledAt = Date.parse('2026-11-13T18:00:12.800+0000');
		const state = newRequestPolling.initialState(enabledAt);
		const sameSecond = issue({ id: '1', created: '2026-11-13T18:00:12.000+0000' });
		const secondBefore = issue({ id: '2', created: '2026-11-13T18:00:11.000+0000' });
		expect(newRequestPolling.selectFresh({ issues: [secondBefore, sameSecond], state }).map((item) => item.id)).toEqual(['1']);
	});
});

describe('newRequestPolling.selectFresh', () => {
	it('keeps only issues created after the window start that were not emitted before', () => {
		const state = { windowStart: T0, seen: { '2': T0 + 1000 } };
		const issues = [
			issue({ id: '1', created: '2026-11-13T17:59:59.000+0000' }),
			issue({ id: '2', created: '2026-11-13T18:00:01.000+0000' }),
			issue({ id: '3', created: '2026-11-13T18:00:01.000+0000' }),
		];
		expect(newRequestPolling.selectFresh({ issues, state }).map((item) => item.id)).toEqual(['3']);
	});

	it('emits two requests created in the same second across two polls', () => {
		const first = issue({ id: '10', created: '2026-11-13T18:00:06.000+0000' });
		const second = issue({ id: '11', created: '2026-11-13T18:00:06.000+0000' });
		const start = { windowStart: T0, seen: {} };
		const freshOne = newRequestPolling.selectFresh({ issues: [first], state: start });
		const afterOne = newRequestPolling.advance({ state: start, issues: [first], fresh: freshOne, truncated: false, now: T0 + 10_000 });
		const freshTwo = newRequestPolling.selectFresh({ issues: [first, second], state: afterOne });
		expect(freshOne.map((item) => item.id)).toEqual(['10']);
		expect(freshTwo.map((item) => item.id)).toEqual(['11']);
	});

	it('ignores issues without a readable created date', () => {
		const state = { windowStart: T0, seen: {} };
		expect(newRequestPolling.selectFresh({ issues: [{ id: '1', key: 'SD-1', fields: {} }], state })).toEqual([]);
	});
});

describe('newRequestPolling.advance', () => {
	it('keeps the window start until the lookback passes it, then slides and forgets old ids', () => {
		const fresh = [issue({ id: '1', created: '2026-11-13T18:01:00.000+0000' })];
		const early = newRequestPolling.advance({ state: { windowStart: T0, seen: {} }, issues: fresh, fresh, truncated: false, now: T0 + 5 * MINUTE });
		expect(early).toEqual({ windowStart: T0, seen: { '1': T0 + MINUTE } });
		const later = newRequestPolling.advance({ state: early, issues: [], fresh: [], truncated: false, now: T0 + 30 * MINUTE });
		expect(later).toEqual({ windowStart: T0 + 15 * MINUTE, seen: {} });
	});

	it('moves the window to just before the newest fetched issue when the page was truncated', () => {
		const issues = [
			issue({ id: '1', created: '2026-11-13T18:01:00.000+0000' }),
			issue({ id: '2', created: '2026-11-13T18:02:00.000+0000' }),
		];
		const next = newRequestPolling.advance({ state: { windowStart: T0, seen: {} }, issues, fresh: issues, truncated: true, now: T0 + 60 * MINUTE });
		expect(next.windowStart).toBe(T0 + 2 * MINUTE - 1);
		expect(next.seen).toEqual({ '2': T0 + 2 * MINUTE });
	});
});

describe('newRequestPolling.planPoll', () => {
	it('emits at most 200 requests per poll and continues from the last one emitted', () => {
		const issues = Array.from({ length: 250 }, (_, index) =>
			issue({ id: String(index + 1), created: new Date(T0 + (index + 1) * 1000).toISOString() }),
		);
		const first = newRequestPolling.planPoll({ state: { windowStart: T0, seen: {} }, issues, truncated: false, now: T0 + 10 * MINUTE });
		expect(first.emit).toHaveLength(200);
		expect(first.nextState.windowStart).toBe(T0 + 200 * 1000 - 1);
		const second = newRequestPolling.planPoll({ state: first.nextState, issues, truncated: false, now: T0 + 11 * MINUTE });
		expect(second.emit.map((item) => item.id)).toEqual(Array.from({ length: 50 }, (_, index) => String(index + 201)));
	});

	it('gets through more than 200 requests created in the same second', () => {
		const issues = Array.from({ length: 250 }, (_, index) => issue({ id: String(index + 1), created: '2026-11-13T18:00:06.000+0000' }));
		const first = newRequestPolling.planPoll({ state: { windowStart: T0, seen: {} }, issues, truncated: false, now: T0 + MINUTE });
		const second = newRequestPolling.planPoll({ state: first.nextState, issues, truncated: false, now: T0 + 2 * MINUTE });
		expect(first.emit).toHaveLength(200);
		expect(second.emit).toHaveLength(50);
		expect(new Set([...first.emit, ...second.emit].map((item) => item.id)).size).toBe(250);
	});

	it('moves the window forward when a cut-off search holds nothing new, so the trigger cannot stall', () => {
		const old = [issue({ id: '1', created: '2026-11-13T17:59:00.000+0000' })];
		const plan = newRequestPolling.planPoll({ state: { windowStart: T0, seen: {} }, issues: old, truncated: true, now: T0 + 10 * MINUTE });
		expect(plan.emit).toEqual([]);
		expect(plan.nextState.windowStart).toBe(T0 + MINUTE);
	});
});

describe('newRequestPolling.relativeJqlDate', () => {
	it('rounds up to whole minutes plus one so no request is missed', () => {
		expect(newRequestPolling.relativeJqlDate({ sinceEpochMs: T0, now: T0 + 90_000 })).toBe('"-3m"');
		expect(newRequestPolling.relativeJqlDate({ sinceEpochMs: T0, now: T0 })).toBe('"-1m"');
	});
});

describe('newRequestPolling.onEnable', () => {
	it('starts a new window on a first enable', async () => {
		const store = memoryStore();
		await newRequestPolling.onEnable({ store, isRepublish: false });
		expect(store.saved()).toMatchObject({ seen: {} });
	});

	it('keeps the saved window on a republish, so requests created since the last poll are not lost', async () => {
		const saved: PollingState = { windowStart: T0, seen: { '7': T0 + 1000 } };
		const store = memoryStore(saved);
		await newRequestPolling.onEnable({ store, isRepublish: true });
		expect(store.saved()).toEqual(saved);
	});
});

describe('newRequestPolling.poll', () => {
	const auth = { deployment: 'data_center', instanceUrl: 'https://jira.acme.test', apiToken: 'pat' };
	const old = Array.from({ length: 500 }, (_, index) => issue({ id: String(index + 1), created: '2026-11-13T17:59:59.000+0000' }));
	const fresh = Array.from({ length: 100 }, (_, index) => issue({ id: String(index + 501), created: '2026-11-13T18:01:00.000+0000' }));

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('looks deeper when the first 500 results hold nothing new, emits what it finds and saves the cursor', async () => {
		vi.spyOn(Date, 'now').mockReturnValue(T0 + 5 * MINUTE);
		const spy = mockJira({ issues: [...old, ...fresh] });
		const store = memoryStore({ windowStart: T0, seen: {} });
		const requests = await newRequestPolling.poll({ auth, store, serviceDeskId: '1' });
		const searches = searchesOf(spy);
		expect(searches[0].body).toMatchObject({ jql: 'project = 10000 AND created > "-6m" ORDER BY created ASC', startAt: 0 });
		expect(searches.filter((request) => bodyOf(request)['startAt'] === 0)).toHaveLength(2);
		expect(requests.map((request) => request.issue_key)).toEqual(fresh.map((item) => item.key));
		expect(Object.keys(store.saved()?.seen ?? {})).toHaveLength(100);
	});

	it('does not move the cursor when loading a request fails, so the next poll tries again', async () => {
		vi.spyOn(Date, 'now').mockReturnValue(T0 + 5 * MINUTE);
		mockJira({ issues: fresh, failRequestId: '550' });
		const before: PollingState = { windowStart: T0, seen: {} };
		const store = memoryStore(before);
		await expect(newRequestPolling.poll({ auth, store, serviceDeskId: '1' })).rejects.toThrow('(500)');
		expect(store.saved()).toEqual(before);
	});

	it('shows the five newest requests in a test, without touching the cursor', async () => {
		const spy = mockJira({ issues: fresh });
		const requests = await newRequestPolling.test({ auth, serviceDeskId: '1' });
		expect(searchesOf(spy)[0].body).toMatchObject({ jql: 'project = 10000 ORDER BY created DESC', maxResults: 5 });
		expect(requests).toHaveLength(5);
	});
});

function memoryStore(initial?: PollingState) {
	const data = new Map<string, string>(initial ? [[STATE_KEY, JSON.stringify(initial)]] : []);
	const read = (key: string) => {
		const raw = data.get(key);
		return raw === undefined ? null : JSON.parse(raw);
	};
	return {
		saved: (): PollingState | null => read(STATE_KEY),
		put: async <T>(key: string, value: T): Promise<T> => {
			data.set(key, JSON.stringify(value));
			return value;
		},
		get: async <T>(key: string): Promise<T | null> => read(key),
		delete: async (key: string): Promise<void> => {
			data.delete(key);
		},
	};
}

function mockJira({ issues, failRequestId }: { issues: ReturnType<typeof issue>[]; failRequestId?: string }) {
	return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
		if (request.method === HttpMethod.GET && request.url.endsWith('/rest/servicedeskapi/servicedesk/1')) {
			return { status: 200, headers: {}, body: { id: '1', projectId: '10000' } };
		}
		if (request.method === HttpMethod.POST && request.url.endsWith('/rest/api/2/search')) {
			const body = bodyOf(request);
			const startAt = Number(body['startAt'] ?? 0);
			const maxResults = Number(body['maxResults'] ?? 50);
			return { status: 200, headers: {}, body: { issues: issues.slice(startAt, startAt + maxResults), total: issues.length } };
		}
		const id = request.url.split('/request/')[1];
		if (request.method === HttpMethod.GET && id !== undefined && id !== failRequestId) {
			return { status: 200, headers: {}, body: { issueId: id, issueKey: `SD-${id}`, requestFieldValues: [] } };
		}
		throw new HttpError({}, { status: 500, responseBody: { errorMessage: 'Jira is down' } });
	});
}

function searchesOf(spy: ReturnType<typeof mockJira>): HttpRequest[] {
	return spy.mock.calls.map(([request]) => request).filter((request) => request.url.endsWith('/rest/api/2/search'));
}

function bodyOf(request: HttpRequest): Record<string, unknown> {
	return typeof request.body === 'object' && request.body !== null ? { ...request.body } : {};
}

const STATE_KEY = 'newRequestState';
