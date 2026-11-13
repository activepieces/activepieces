import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { HeartbeatApiError, heartbeatApi } from '../src/lib/common/client';
import { heartbeatMessages } from '../src/lib/common/messages';
import { IDS, replies, runStep, stubFetch, TOKEN } from './helpers';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('validators', () => {
	test('uuid accepts and lower-cases a UUID', () => {
		expect(heartbeatApi.uuid({ value: ` ${IDS.user.toUpperCase()} `, label: 'User ID' })).toBe(IDS.user);
	});
	test.each(['', 'abc', '../users', `${IDS.user}/x`, '//evil.io', undefined])('uuid rejects %p', (value) => {
		expect(() => heartbeatApi.uuid({ value, label: 'User ID' })).toThrow(/User ID/);
	});
	test('optionalUuid returns undefined for blank', () => {
		expect(heartbeatApi.optionalUuid({ value: ' ', label: 'X' })).toBeUndefined();
	});
	test('uuidList dedupes, accepts comma text and enforces bounds', () => {
		expect(heartbeatApi.uuidList({ value: `${IDS.user},${IDS.user}\n${IDS.admin}`, label: 'IDs' })).toEqual([IDS.user, IDS.admin]);
		expect(() => heartbeatApi.uuidList({ value: [], label: 'IDs', min: 1 })).toThrow(/at least one/);
		expect(() => heartbeatApi.uuidList({ value: [{ a: 1 }], label: 'IDs' })).toThrow(/list of text/);
	});
	test('emailList validates, dedupes case-insensitively and caps at 100', () => {
		expect(heartbeatApi.emailList({ value: ['a@x.io', 'A@x.io', 'b@x.io'], label: 'Emails' })).toEqual(['a@x.io', 'b@x.io']);
		expect(() => heartbeatApi.emailList({ value: ['nope'], label: 'Emails' })).toThrow(/not a valid email/);
		const many = Array.from({ length: 101 }, (_, i) => `u${i}@x.io`);
		expect(() => heartbeatApi.emailList({ value: many, label: 'Emails' })).toThrow(/at most 100/);
	});
	test('limit validates range and type', () => {
		expect(heartbeatApi.limit({ value: undefined, max: 100, defaultValue: 20 })).toBe(20);
		expect(heartbeatApi.limit({ value: '5', max: 100, defaultValue: 20 })).toBe(5);
		expect(() => heartbeatApi.limit({ value: 0, max: 100, defaultValue: 20 })).toThrow();
		expect(() => heartbeatApi.limit({ value: 2.5, max: 100, defaultValue: 20 })).toThrow();
		expect(() => heartbeatApi.limit({ value: 101, max: 100, defaultValue: 20 })).toThrow();
	});
	test('isoDate normalises and rejects garbage', () => {
		expect(heartbeatApi.isoDate({ value: '2026-10-13T15:00:00Z', label: 'Start' })).toBe('2026-10-13T15:00:00.000Z');
		expect(heartbeatApi.isoDate({ value: '', label: 'Start' })).toBeUndefined();
		expect(() => heartbeatApi.isoDate({ value: 'tomorrow-ish', label: 'Start' })).toThrow(/not a valid date/);
	});
	test('optionalUrl requires http(s)', () => {
		expect(heartbeatApi.optionalUrl({ value: 'https://x.io/a', label: 'URL' })).toBe('https://x.io/a');
		expect(() => heartbeatApi.optionalUrl({ value: 'javascript:alert(1)', label: 'URL' })).toThrow();
		expect(() => heartbeatApi.optionalUrl({ value: 'linkedin.com/in/x', label: 'URL' })).toThrow();
	});
	test('triState maps yes/no/unchanged', () => {
		expect(heartbeatApi.triState('yes')).toBe(true);
		expect(heartbeatApi.triState('no')).toBe(false);
		expect(heartbeatApi.triState('unchanged')).toBeUndefined();
	});
	test('toPage sets cursor only on a full page', () => {
		expect(heartbeatApi.toPage({ items: [{ id: 'a' }, { id: 'b' }], pageLimit: 2 })).toEqual({ items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'b', hasMore: true });
		expect(heartbeatApi.toPage({ items: [{ id: 'a' }], pageLimit: 2 })).toEqual({ items: [{ id: 'a' }], nextCursor: null, hasMore: false });
	});
});

describe('request', () => {
	test('sends bearer auth to the v0 base URL with JSON body', async () => {
		const seen = stubFetch(replies([{ body: { ok: true } }]));
		await runStep(heartbeatApi.request({ token: ` ${TOKEN} `, method: HttpMethod.PUT, path: '/groups', operation: 'x', body: { name: 'A' } }));
		expect(seen[0].url).toBe('https://api.heartbeat.chat/v0/groups');
		expect(seen[0].auth).toBe(`Bearer ${TOKEN}`);
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({ name: 'A' });
	});
	test('drops empty query values', async () => {
		const seen = stubFetch(replies([{ body: [] }]));
		await runStep(heartbeatApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/events', operation: 'x', query: { groupID: undefined, limit: 5 } }));
		expect(seen[0].query.has('groupID')).toBe(false);
		expect(seen[0].query.get('limit')).toBe('5');
	});
	test('retries 429 twice then succeeds', async () => {
		const seen = stubFetch(replies([{ status: 429, body: { message: 'slow' } }, { status: 429 }, { body: [1] }]));
		await expect(runStep(heartbeatApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/roles', operation: 'list roles' }))).resolves.toEqual([1]);
		expect(seen).toHaveLength(3);
	});
	test('gives up after two 429 retries', async () => {
		const seen = stubFetch(replies([{ status: 429, body: { message: 'slow down' } }]));
		await expect(runStep(heartbeatApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/roles', operation: 'list roles' }))).rejects.toThrow(/rate limit/);
		expect(seen).toHaveLength(3);
	});
	test('wraps errors with status, vendor message and responseBody', async () => {
		stubFetch(replies([{ status: 400, body: { code: 'VALIDATION_ERROR', message: 'User already exists in community', type: 'ValidationError' } }]));
		const error = await runStep(heartbeatApi.request({ token: TOKEN, method: HttpMethod.PUT, path: '/users', operation: 'create member' })).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(HeartbeatApiError);
		expect(String(error)).toContain('Heartbeat create member failed (400): User already exists in community');
		expect(Reflect.get(Object(error), 'responseBody')).toEqual({ code: 'VALIDATION_ERROR', message: 'User already exists in community', type: 'ValidationError' });
		expect(Reflect.get(Object(error), 'body')).toBeUndefined();
		expect(heartbeatApi.statusOf(error)).toBe(400);
		expect(heartbeatApi.errorMessageOf(error)).toBe('User already exists in community');
	});
	test('truncates long vendor text to 500 chars', async () => {
		stubFetch(replies([{ status: 500, text: 'x'.repeat(2000) }]));
		const error = await runStep(heartbeatApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/roles', operation: 'list roles' })).catch((e: unknown) => e);
		expect(String(error).length).toBeLessThan(600);
	});
	test('401 explains the plan gate', async () => {
		stubFetch(replies([{ status: 401, body: { message: 'Unauthorized' } }]));
		await expect(runStep(heartbeatApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/roles', operation: 'list roles' }))).rejects.toThrow(/plan does not include API access/);
	});
	test('204 resolves without a body', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));
		await expect(runStep(heartbeatApi.request({ token: TOKEN, method: HttpMethod.PUT, path: '/directMessages', operation: 'send' }))).resolves.toBeFalsy();
	});
});

describe('messages.findSentMessage', () => {
	const sentAfter = Date.parse('2026-10-06T12:10:00Z');
	test('matches by plain text and sender, newest first', () => {
		const messages = [
			{ id: 'old', userID: IDS.admin, content: '<p>Hi</p>', createdAt: '2026-10-06T12:10:01Z' },
			{ id: 'new', userID: IDS.admin, content: '<p>Hi</p>', createdAt: '2026-10-06T12:10:05Z' },
			{ id: 'other', userID: IDS.user, content: '<p>Hi</p>', createdAt: '2026-10-06T12:10:06Z' },
		];
		expect(heartbeatMessages.findSentMessage({ messages, text: 'Hi', senderId: IDS.admin, sentAfter })?.['id']).toBe('new');
	});
	test('ignores messages older than the send time', () => {
		const messages = [{ id: 'stale', userID: IDS.admin, content: 'Hi', createdAt: '2026-10-05T00:00:00Z' }];
		expect(heartbeatMessages.findSentMessage({ messages, text: 'Hi', senderId: undefined, sentAfter })).toBeNull();
	});
});
