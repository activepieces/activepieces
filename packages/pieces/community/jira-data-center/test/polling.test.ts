import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { JiraDataCenterAuth } from '../src/auth';
import { createJiraPolling, createJiraStatusPolling, jiraPollingInternals } from '../src/lib/common/polling';

const T0 = Date.parse('2026-11-14T10:00:00.000+0000');
const MINUTE = 60_000;
const auth: JiraDataCenterAuth = {
	type: AppConnectionType.CUSTOM_AUTH,
	props: { instanceUrl: 'https://jira.acme.test', personalAccessToken: 'pat' },
};

function memoryStore(): Store {
	const data = new Map<string, string>();
	return {
		put: async <T>(key: string, value: T): Promise<T> => {
			data.set(key, JSON.stringify(value));
			return value;
		},
		get: async <T>(key: string): Promise<T | null> => {
			const raw = data.get(key);
			return raw === undefined ? null : JSON.parse(raw);
		},
		delete: async (key: string): Promise<void> => {
			data.delete(key);
		},
	};
}

function mockSearch(pages: Array<{ issues: unknown[]; total?: number }>) {
	let call = 0;
	return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (_request: HttpRequest) => {
		const page = pages[Math.min(call, pages.length - 1)];
		call += 1;
		return { status: 200, headers: {}, body: { issues: page.issues, total: page.total ?? page.issues.length } };
	});
}

function bodyOf({ spy, call }: { spy: ReturnType<typeof mockSearch>; call: number }): Record<string, unknown> {
	const body: unknown = spy.mock.calls[call][0].body;
	return isRecord(body) ? body : {};
}

function jqlOf(spy: ReturnType<typeof mockSearch>): unknown {
	return bodyOf({ spy, call: 0 })['jql'];
}

function idsOf(items: unknown[]): unknown[] {
	return items.map((item) => (isRecord(item) ? item['id'] : undefined));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function issue({ id, created, updated }: { id: string; created?: string; updated?: string }) {
	return { id, key: `SD-${id}`, fields: { created, updated } };
}

function statusIssue({ id, updated, changes }: { id: string; updated: string; changes: Array<{ at: string; field: string; fieldtype?: string }> }) {
	return {
		id,
		key: `SD-${id}`,
		fields: { updated },
		changelog: { histories: changes.map((change) => ({ created: change.at, items: [{ field: change.field, fieldtype: change.fieldtype ?? 'jira' }] })) },
	};
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('composeJql', () => {
	it('watches every issue when the filter is empty', () => {
		expect(jiraPollingInternals.composeJql({ userJql: undefined, since: '-3m', direction: 'ASC', timeField: 'created' })).toBe(
			"created > '-3m' ORDER BY created ASC",
		);
	});

	it('wraps the user filter and drops its own ORDER BY', () => {
		expect(
			jiraPollingInternals.composeJql({ userJql: 'project = SD OR project = OPS order by priority DESC', since: '-3m', direction: 'ASC', timeField: 'updated' }),
		).toBe("(project = SD OR project = OPS) AND updated > '-3m' ORDER BY updated ASC");
	});

	it('treats a filter that is only an ORDER BY as empty', () => {
		expect(jiraPollingInternals.composeJql({ userJql: 'ORDER BY created DESC', since: null, direction: 'DESC', timeField: 'created' })).toBe(
			'ORDER BY created DESC',
		);
	});

	it('keeps the words "order by" when they are inside a quoted value', () => {
		expect(jiraPollingInternals.stripTrailingOrderBy('summary ~ "sort order by date" ORDER BY created')).toBe('summary ~ "sort order by date"');
	});
});

describe('toRelativeJqlDate', () => {
	it('sends minutes back from now, never a wall-clock time that Jira would read in the user time zone', () => {
		expect(jiraPollingInternals.toRelativeJqlDate({ sinceEpochMS: T0 - 5 * MINUTE, now: T0 })).toBe('-6m');
		expect(jiraPollingInternals.toRelativeJqlDate({ sinceEpochMS: T0 + MINUTE, now: T0 })).toBe('-1m');
	});
});

describe('New Issue polling', () => {
	const polling = createJiraPolling({ timeField: 'created' });

	it('emits an issue created after the flow was enabled, once, with no absolute date in the query', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });

		vi.setSystemTime(T0 + 5 * MINUTE);
		const created = issue({ id: '1', created: '2026-11-14T10:02:00.000+0000' });
		const before = issue({ id: '0', created: '2026-11-14T09:59:00.000+0000' });
		const spy = mockSearch([{ issues: [before, created] }]);

		const first = await polling.poll({ context: { auth, propsValue: { jql: 'project = SD' }, store } });
		const second = await polling.poll({ context: { auth, propsValue: { jql: 'project = SD' }, store } });

		expect(idsOf(first)).toEqual(['1']);
		expect(second).toEqual([]);
		expect(jqlOf(spy)).toBe("(project = SD) AND created > '-7m' ORDER BY created ASC");
		expect(jqlOf(spy)).not.toMatch(/\d{4}-\d{2}-\d{2}/);
	});

	it('emits an issue created in the same second the flow was enabled (Jira rounds created down to the second)', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(Date.parse('2026-11-14T10:00:12.800+0000'));
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		mockSearch([{ issues: [issue({ id: '1', created: '2026-11-14T10:00:12.000+0000' }), issue({ id: '2', created: '2026-11-14T10:00:11.000+0000' })] }]);

		const result = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(idsOf(result)).toEqual(['1']);
	});

	it('emits two issues created in the same second when they show up in different polls', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + MINUTE);
		const one = issue({ id: '10', created: '2026-11-14T10:00:30.000+0000' });
		const two = issue({ id: '11', created: '2026-11-14T10:00:30.000+0000' });
		mockSearch([{ issues: [one] }, { issues: [one, two] }]);

		const first = await polling.poll({ context: { auth, propsValue: {}, store } });
		const second = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(idsOf(first)).toEqual(['10']);
		expect(idsOf(second)).toEqual(['11']);
	});

	it('reads the next page when Jira returns fewer issues than the total', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + MINUTE);
		const spy = mockSearch([
			{ issues: [issue({ id: '1', created: '2026-11-14T10:00:10.000+0000' })], total: 2 },
			{ issues: [issue({ id: '2', created: '2026-11-14T10:00:20.000+0000' })], total: 2 },
		]);

		const result = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(idsOf(result)).toEqual(['1', '2']);
		expect([0, 1].map((call) => bodyOf({ spy, call })['startAt'])).toEqual([0, 1]);
	});

	it('keeps its place when a flow is republished', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + 10 * MINUTE);
		await polling.onEnable({ context: { auth, propsValue: {}, store, isRepublish: true } });
		mockSearch([{ issues: [issue({ id: '1', created: '2026-11-14T10:05:00.000+0000' })] }]);

		const result = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(idsOf(result)).toEqual(['1']);
	});

	it('returns the five newest issues, newest first, when testing', async () => {
		const issues = [6, 5, 4, 3, 2, 1].map((n) => issue({ id: String(n), created: `2026-11-14T10:0${n}:00.000+0000` }));
		const spy = mockSearch([{ issues }]);

		const result = await polling.test({ context: { auth, propsValue: {}, store: memoryStore() } });

		expect(idsOf(result)).toEqual(['6', '5', '4', '3', '2']);
		expect(jqlOf(spy)).toBe('ORDER BY created DESC');
	});
});

describe('New Issue polling after a burst or an upgrade', () => {
	const polling = createJiraPolling({ timeField: 'created' });

	it('continues from an exact time after a poll that could not read everything, so a big burst cannot make it read the same issues forever', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + 3 * MINUTE);
		const burst = Array.from({ length: 10 }, (_, n) => ({ issues: [issue({ id: String(n + 1), created: `2026-11-14T10:01:0${n}.000+0000` })], total: 50 }));
		const rest = { issues: [issue({ id: '10', created: '2026-11-14T10:01:09.000+0000' }), issue({ id: '11', created: '2026-11-14T10:01:30.000+0000' })] };
		const spy = mockSearch([...burst, rest]);

		const first = await polling.poll({ context: { auth, propsValue: {}, store } });
		const second = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(idsOf(first)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
		expect(idsOf(second)).toEqual(['11']);
		expect(bodyOf({ spy, call: 0 })['jql']).toBe("created > '-5m' ORDER BY created ASC");
		expect(bodyOf({ spy, call: 10 })['jql']).toBe(`created > ${Date.parse('2026-11-14T10:01:09.000+0000') - 1} ORDER BY created ASC`);
	});

	it('does not send again what it already sent when more than 2,000 issues land in one window', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + 2 * MINUTE);
		const many = Array.from({ length: 2100 }, (_, n) => issue({ id: String(n + 1), created: new Date(T0 + 1000 + n * 10).toISOString() }));
		mockSearch([{ issues: many }]);

		const first = await polling.poll({ context: { auth, propsValue: {}, store } });
		const second = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(first).toHaveLength(2100);
		expect(second).toEqual([]);
	});

	it('picks up from the old checkpoint when a live flow is republished on this version', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await store.put('lastPoll', T0 - 4 * MINUTE);
		await polling.onEnable({ context: { auth, propsValue: {}, store, isRepublish: true } });
		mockSearch([{ issues: [issue({ id: '1', created: '2026-11-14T09:55:00.000+0000' }), issue({ id: '2', created: '2026-11-14T09:58:00.000+0000' })] }]);

		const result = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(idsOf(result)).toEqual(['2']);
	});

	it('goes back 15 minutes at most when the old checkpoint is stale', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await store.put('lastPoll', T0 - 3 * 24 * 60 * MINUTE);
		mockSearch([{ issues: [issue({ id: '1', created: '2026-11-14T09:40:00.000+0000' }), issue({ id: '2', created: '2026-11-14T09:50:00.000+0000' })] }]);

		const result = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(idsOf(result)).toEqual(['2']);
	});

	it('starts from now when a flow is enabled fresh, even if an old checkpoint is still stored', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await store.put('lastPoll', T0 - 4 * MINUTE);
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		mockSearch([{ issues: [issue({ id: '1', created: '2026-11-14T09:58:00.000+0000' })] }]);

		expect(await polling.poll({ context: { auth, propsValue: {}, store } })).toEqual([]);
	});
});

describe('Updated Issue Status polling', () => {
	const polling = createJiraStatusPolling();

	async function enabledStore() {
		vi.useFakeTimers();
		vi.setSystemTime(T0);
		const store = memoryStore();
		await polling.onEnable({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + 2 * MINUTE);
		return store;
	}

	it('emits an issue whose status moved, without the changelog it was read from', async () => {
		const store = await enabledStore();
		const spy = mockSearch([{ issues: [statusIssue({ id: '1', updated: '2026-11-14T10:01:00.000+0000', changes: [{ at: '2026-11-14T10:01:00.500+0000', field: 'status' }] })] }]);

		const result = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ id: '1', key: 'SD-1' });
		expect(result[0]).not.toHaveProperty('changelog');
		expect(jqlOf(spy)).toBe("status CHANGED AFTER '-4m' AND updated > '-4m' ORDER BY updated ASC");
		expect(bodyOf({ spy, call: 0 })['expand']).toEqual(['changelog']);
	});

	it('does not fire for a new issue, an edit of another field, or a custom field named status', async () => {
		const store = await enabledStore();
		mockSearch([
			{
				issues: [
					statusIssue({ id: '1', updated: '2026-11-14T10:01:00.000+0000', changes: [] }),
					statusIssue({ id: '2', updated: '2026-11-14T10:01:00.000+0000', changes: [{ at: '2026-11-14T10:01:00.100+0000', field: 'assignee' }] }),
					statusIssue({ id: '3', updated: '2026-11-14T10:01:00.000+0000', changes: [{ at: '2026-11-14T10:01:00.100+0000', field: 'status', fieldtype: 'custom' }] }),
				],
			},
		]);

		expect(await polling.poll({ context: { auth, propsValue: {}, store } })).toEqual([]);
	});

	it('does not fire again when the issue is edited later without a status move', async () => {
		const store = await enabledStore();
		const moved = { at: '2026-11-14T10:01:00.500+0000', field: 'status' };
		mockSearch([
			{ issues: [statusIssue({ id: '1', updated: '2026-11-14T10:01:00.000+0000', changes: [moved] })] },
			{ issues: [statusIssue({ id: '1', updated: '2026-11-14T10:03:00.000+0000', changes: [moved, { at: '2026-11-14T10:03:00.200+0000', field: 'summary' }] })] },
		]);

		const first = await polling.poll({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + 4 * MINUTE);
		const second = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(first).toHaveLength(1);
		expect(second).toEqual([]);
	});

	it('fires again when the status moves a second time', async () => {
		const store = await enabledStore();
		const moved = { at: '2026-11-14T10:01:00.500+0000', field: 'status' };
		mockSearch([
			{ issues: [statusIssue({ id: '1', updated: '2026-11-14T10:01:00.000+0000', changes: [moved] })] },
			{ issues: [statusIssue({ id: '1', updated: '2026-11-14T10:03:00.000+0000', changes: [moved, { at: '2026-11-14T10:03:00.200+0000', field: 'status' }] })] },
		]);

		const first = await polling.poll({ context: { auth, propsValue: {}, store } });
		vi.setSystemTime(T0 + 4 * MINUTE);
		const second = await polling.poll({ context: { auth, propsValue: {}, store } });

		expect(first).toHaveLength(1);
		expect(second).toHaveLength(1);
	});
});
