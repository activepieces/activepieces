import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskadeApiError, taskadeApi } from '../src/lib/common/client';
import { replies, runStep, stubFetch } from './helpers';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

function get({ path, version = 'v1' }: { path: string; version?: 'v1' | 'v2' }) {
	return runStep(taskadeApi.request({ token: ' tok ', method: HttpMethod.GET, path, version, operation: 'test op' }));
}

describe('request', () => {
	test('builds v1 and v2 URLs on www.taskade.com with a trimmed bearer token', async () => {
		const seen = stubFetch(() => ({ body: { ok: true } }));
		await get({ path: '/workspaces' });
		await get({ path: '/webhooks', version: 'v2' });
		expect(seen[0].url).toBe('https://www.taskade.com/api/v1/workspaces');
		expect(seen[1].url).toBe('https://www.taskade.com/api/v2/webhooks');
		expect(seen[0].auth).toBe('Bearer tok');
	});
	test('refuses a path without a leading slash', async () => {
		stubFetch(() => ({ body: {} }));
		await expect(get({ path: 'evil.com/x' })).rejects.toThrow('must start with');
	});
	test('retries 429 twice, then fails with a rate-limit message', async () => {
		const seen = stubFetch(() => ({ status: 429, body: { ok: false, code: 'TOO_MANY_REQUESTS', message: 'slow down' } }));
		const error = await get({ path: '/workspaces' }).catch((e: unknown) => e);
		expect(seen).toHaveLength(3);
		expect(error).toBeInstanceOf(TaskadeApiError);
		expect(String(error)).toContain('rate limit');
	});
	test('a 429 followed by success returns the body', async () => {
		stubFetch(replies([{ status: 429, body: {} }, { body: { ok: true, items: [1] } }]));
		await expect(get({ path: '/workspaces' })).resolves.toEqual({ ok: true, items: [1] });
	});
	test('total 429 wait stays bounded', () => {
		expect(taskadeApi.RATE_LIMIT_RETRY_DELAYS_MS.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(30_000);
	});
	test('errors carry status, code and responseBody but never a body field', async () => {
		stubFetch(() => ({ status: 404, body: { ok: false, code: 'NOT_FOUND', message: 'Document not found' } }));
		const error = await get({ path: '/projects/x' }).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(TaskadeApiError);
		if (!(error instanceof TaskadeApiError)) {
			return;
		}
		expect(error.status).toBe(404);
		expect(error.code).toBe('NOT_FOUND');
		expect(error.responseBody).toMatchObject({ message: 'Document not found' });
		expect(Reflect.has(error, 'body')).toBe(false);
		expect(error.message).toBe('Taskade test op failed (404 NOT_FOUND): not found. Check the IDs you passed. Document not found');
		expect(taskadeApi.isNotFound(error)).toBe(true);
	});
	test('402 explains credits or plan with the feature id', async () => {
		stubFetch(() => ({ status: 402, body: { ok: false, code: 'PAYMENT_REQUIRED', message: 'No', featureId: 'ai' } }));
		await expect(get({ path: '/x' })).rejects.toThrow('AI credits or a higher Taskade plan (feature: ai)');
	});
	test('a 200 with ok:false is an error', async () => {
		stubFetch(() => ({ body: { ok: false, message: 'nope' } }));
		await expect(get({ path: '/x' })).rejects.toThrow('nope');
	});
	test('vendor messages are capped at 500 characters', async () => {
		stubFetch(() => ({ status: 500, body: { ok: false, message: 'x'.repeat(2000) } }));
		const error = await get({ path: '/x' }).catch((e: unknown) => e);
		expect(String(error instanceof Error ? error.message : '').length).toBeLessThan(600);
	});
});

describe('ids and paths', () => {
	test('seg encodes and rejects dot segments and empties', () => {
		expect(taskadeApi.seg({ value: 'a/b?c', label: 'X' })).toBe('a%2Fb%3Fc');
		expect(() => taskadeApi.seg({ value: '..', label: 'X' })).toThrow('not a valid');
		expect(() => taskadeApi.seg({ value: '  ', label: 'X' })).toThrow('X is required');
	});
	test('parseProjectId accepts ids and taskade links only', () => {
		expect(taskadeApi.parseProjectId('DkZoeHwNZ5SJ2vGA')).toBe('DkZoeHwNZ5SJ2vGA');
		expect(taskadeApi.parseProjectId('https://www.taskade.com/d/DkZoeHwNZ5SJ2vGA?x=1')).toBe('DkZoeHwNZ5SJ2vGA');
		expect(taskadeApi.parseProjectId('https://taskade.com/d/abc')).toBe('abc');
		expect(() => taskadeApi.parseProjectId('https://www.taskade.com.evil.io/d/abc')).toThrow('not a Taskade project link');
		expect(() => taskadeApi.parseProjectId('https://user@www.taskade.com/d/abc')).toThrow('not a Taskade project link');
		expect(() => taskadeApi.parseProjectId('http://www.taskade.com/d/abc')).toThrow('not a Taskade project link');
		expect(() => taskadeApi.parseProjectId('https://www.taskade.com/settings')).toThrow('Could not find a project ID');
		expect(() => taskadeApi.parseProjectId('../workspaces')).toThrow('not a valid Project ID');
	});
	test('taskPath builds an encoded task path', () => {
		expect(taskadeApi.taskPath({ projectId: 'https://www.taskade.com/d/P1', taskId: 't 1' })).toBe('/projects/P1/tasks/t%201');
	});
	test('validateInteger enforces ranges', () => {
		expect(taskadeApi.validateInteger({ value: '5', label: 'Limit', min: 1, max: 10 })).toBe(5);
		expect(taskadeApi.validateInteger({ value: undefined, label: 'Limit', min: 1, max: 10 })).toBeUndefined();
		expect(() => taskadeApi.validateInteger({ value: 11, label: 'Limit', min: 1, max: 10 })).toThrow('between 1 and 10');
		expect(() => taskadeApi.validateInteger({ value: 1.5, label: 'Limit', min: 1, max: 10 })).toThrow('whole number');
	});
});
