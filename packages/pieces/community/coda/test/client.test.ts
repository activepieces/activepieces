import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CodaApiError, codaApi } from '../src/lib/common/client';
import { replies, runStep, stubFetch, TOKEN } from './helpers';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('pathSegment', () => {
	test('encodes names with spaces and slashes', () => {
		expect(codaApi.pathSegment({ value: ' My Table/2 ', label: 'Table' })).toBe('My%20Table%2F2');
	});
	test.each(['', '   ', '.', '..', undefined, null])('rejects %p', (value) => {
		expect(() => codaApi.pathSegment({ value, label: 'Table' })).toThrow();
	});
});

describe('parseDocId', () => {
	test.each([
		['AbC123xyZ', 'AbC123xyZ'],
		['https://coda.io/d/My-Doc_dAbC123xyZ', 'AbC123xyZ'],
		['https://coda.io/d/My-Doc_dAbC123xyZ/Page_suXYZ#_tugrid-1', 'AbC123xyZ'],
		['https://docs.superhuman.com/d/_dMG3aOhChDA', 'MG3aOhChDA'],
		['https://www.coda.io/d/_dMG3aOhChDA/_suBzIp5A', 'MG3aOhChDA'],
	])('%s → %s', (input, expected) => {
		expect(codaApi.parseDocId(input)).toBe(expected);
	});
	test.each([
		'https://coda.io.evil.io/d/_dMG3aOhChDA',
		'https://evil.example.com/d/_dMG3aOhChDA',
		'https://coda.io/docs',
		'../etc',
		'abc/def',
		'',
	])('rejects %s', (input) => {
		expect(() => codaApi.parseDocId(input)).toThrow();
	});
	test('docPath always encodes the parsed id', () => {
		expect(codaApi.docPath('https://coda.io/d/X_dAbc-1_2')).toBe('/docs/Abc-1_2');
	});
});

describe('buildRowQuery', () => {
	test('keeps column ids bare and quotes text values', () => {
		expect(codaApi.buildRowQuery({ column: 'c-abc', value: 'Ada "A"' })).toBe('c-abc:"Ada \\"A\\""');
	});
	test('quotes column names', () => {
		expect(codaApi.buildRowQuery({ column: 'Due Time', value: 'x' })).toBe('"Due Time":"x"');
	});
	test('numbers and booleans stay unquoted', () => {
		expect(codaApi.buildRowQuery({ column: 'c-a', value: 5 })).toBe('c-a:5');
		expect(codaApi.buildRowQuery({ column: 'c-a', value: true })).toBe('c-a:true');
	});
});

describe('validateLimit and toPageOutput', () => {
	test('limit bounds', () => {
		expect(codaApi.validateLimit({ limit: undefined, max: 100 })).toBeUndefined();
		expect(codaApi.validateLimit({ limit: 100, max: 100 })).toBe(100);
		expect(() => codaApi.validateLimit({ limit: 0, max: 100 })).toThrow();
		expect(() => codaApi.validateLimit({ limit: 101, max: 100 })).toThrow();
		expect(() => codaApi.validateLimit({ limit: 2.5, max: 100 })).toThrow();
	});
	test('page output never follows nextPageLink', () => {
		expect(codaApi.toPageOutput({ items: [1], nextPageToken: 'n' })).toEqual({ items: [1], nextPageToken: 'n', hasMore: true });
		expect(codaApi.toPageOutput({ items: [] })).toEqual({ items: [], nextPageToken: null, hasMore: false });
	});
});

describe('request', () => {
	test('sends bearer token to coda.io with query params and JSON body', async () => {
		const seen = stubFetch(() => ({ body: { ok: 1 } }));
		const result = await runStep(
			codaApi.request({
				token: ` ${TOKEN} `,
				method: HttpMethod.POST,
				path: '/docs/abc/tables/t/rows',
				operation: 'add rows',
				query: { disableParsing: true, skip: undefined, empty: '' },
				body: { rows: [] },
			}),
		);
		expect(result).toEqual({ ok: 1 });
		expect(seen[0].url.startsWith('https://coda.io/apis/v1/docs/abc/tables/t/rows')).toBe(true);
		expect(seen[0].auth).toBe(`Bearer ${TOKEN}`);
		expect(seen[0].query.get('disableParsing')).toBe('true');
		expect(seen[0].query.has('skip')).toBe(false);
		expect(seen[0].query.has('empty')).toBe(false);
		expect(seen[0].body).toEqual({ rows: [] });
	});

	test('retries 429 twice then succeeds', async () => {
		const seen = stubFetch(replies([{ status: 429, body: { message: 'slow down' } }, { status: 429 }, { body: { done: true } }]));
		const result = await runStep(codaApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/whoami', operation: 'x' }));
		expect(result).toEqual({ done: true });
		expect(seen).toHaveLength(3);
	});

	test('gives up after the retries with a rate-limit message', async () => {
		const seen = stubFetch(() => ({ status: 429, body: { message: 'slow down' } }));
		await expect(runStep(codaApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/whoami', operation: 'get user' }))).rejects.toThrow(
			/Coda get user failed \(429\): Coda rate limit reached/,
		);
		expect(seen).toHaveLength(3);
	});

	test('retries 409 doc-not-ready', async () => {
		stubFetch(replies([{ status: 409, body: { message: 'not accessible yet' } }, { body: { items: [] } }]));
		await expect(runStep(codaApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/docs/a/pages', operation: 'x' }))).resolves.toEqual({ items: [] });
	});

	test('errors carry status and responseBody, never body, and keep the vendor message', async () => {
		stubFetch(() => ({ status: 404, body: { statusCode: 404, message: 'Could not find a row with the specified ID.' } }));
		const error = await runStep(codaApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/docs/a', operation: 'get row' })).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(CodaApiError);
		expect(error).toMatchObject({ status: 404, responseBody: { message: 'Could not find a row with the specified ID.' } });
		expect(error).not.toHaveProperty('body');
		expect(error instanceof Error ? error.message : '').toContain('Could not find a row with the specified ID.');
	});

	test('401 names the token', async () => {
		stubFetch(() => ({ status: 401, body: { message: 'Unauthorized' } }));
		await expect(runStep(codaApi.request({ token: TOKEN, method: HttpMethod.GET, path: '/whoami', operation: 'x' }))).rejects.toThrow(/invalid or was revoked/);
	});
});

describe('waitForMutation', () => {
	test('treats 404 as not registered yet and keeps polling', async () => {
		const seen = stubFetch(replies([{ status: 404 }, { body: { completed: false } }, { body: { completed: true, warning: 'w' } }]));
		const result = await runStep(codaApi.waitForMutation({ token: TOKEN, requestId: 'mutate:1' }));
		expect(result).toEqual({ requestId: 'mutate:1', completed: true, warning: 'w' });
		expect(seen.map((r) => r.path)).toEqual(['/mutationStatus/mutate%3A1', '/mutationStatus/mutate%3A1', '/mutationStatus/mutate%3A1']);
	});

	test('returns completed false after the wait budget instead of failing', async () => {
		const seen = stubFetch(() => ({ body: { completed: false } }));
		const result = await runStep(codaApi.waitForMutation({ token: TOKEN, requestId: 'r', timeoutMs: 10_000 }));
		expect(result).toEqual({ requestId: 'r', completed: false, warning: null });
		expect(seen.length).toBeGreaterThan(1);
		expect(seen.length).toBeLessThanOrEqual(6);
	});

	test('other errors fail', async () => {
		stubFetch(() => ({ status: 500, body: { message: 'boom' } }));
		await expect(runStep(codaApi.waitForMutation({ token: TOKEN, requestId: 'r' }))).rejects.toThrow(/boom/);
	});

	test('settleMutation skips waiting when turned off and refuses a missing request id', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(codaApi.settleMutation({ token: TOKEN, requestId: 'r', waitForCompletion: false })).resolves.toEqual({
			requestId: 'r',
			completed: false,
			warning: null,
		});
		expect(seen).toHaveLength(0);
		await expect(codaApi.settleMutation({ token: TOKEN, requestId: undefined, waitForCompletion: true })).rejects.toThrow(/no request ID/);
	});
});
