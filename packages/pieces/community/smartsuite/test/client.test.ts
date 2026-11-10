import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { smartSuiteClient, SmartSuiteApiError } from '../src/lib/common/client';
import { smartSuitePaginatedApiCall } from '../src/lib/common';
import { smartsuiteAuth } from '../src/lib/auth';
import { replies, stubFetch } from './helpers';

const credentials = { apiKey: ' key-123 ', accountId: ' acct1 ' };

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('client', () => {
	test('sends trimmed token and account headers to the REST host', async () => {
		const seen = stubFetch(() => ({ body: { ok: true } }));
		await smartSuiteClient.request({ credentials, method: HttpMethod.GET, path: '/solutions/', operation: 'x' });
		expect(seen[0].url).toBe('https://app.smartsuite.com/api/v1/solutions/');
		expect(seen[0].headers.get('authorization')).toBe('Token key-123');
		expect(seen[0].headers.get('account-id')).toBe('acct1');
	});
	test('webhooks api goes to the webhooks host', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await smartSuiteClient.request({ credentials, api: 'webhooks', method: HttpMethod.POST, path: '/ListEvents', body: {}, operation: 'x' });
		expect(seen[0].url).toBe('https://webhooks.smartsuite.com/smartsuite.webhooks.engine.Webhooks/ListEvents');
	});
	test('errors carry status and responseBody, never body, and the vendor message', async () => {
		stubFetch(() => ({ status: 422, body: { message: 'Field x is required' } }));
		const error = await smartSuiteClient
			.request({ credentials, method: HttpMethod.POST, path: '/applications/t/records/', body: {}, operation: 'create record' })
			.catch((e: unknown) => e);
		expect(error).toBeInstanceOf(SmartSuiteApiError);
		expect(error).toMatchObject({ status: 422, responseBody: { message: 'Field x is required' } });
		expect(error).not.toHaveProperty('body');
		expect(error).toHaveProperty('message', expect.stringContaining('Field x is required'));
	});
	test('402 explains the plan has no API access', async () => {
		stubFetch(() => ({ status: 402, body: { code: 'PAYMENT_REQUIRED' } }));
		await expect(smartSuiteClient.request({ credentials, method: HttpMethod.GET, path: '/solutions/', operation: 'list' })).rejects.toThrow(/no API access/);
	});
	test('retries 429 at most twice with a short backoff', async () => {
		const seen = stubFetch(replies([{ status: 429 }, { status: 429 }, { status: 429 }]));
		const waits: number[] = [];
		await expect(
			smartSuiteClient.request({ credentials, method: HttpMethod.GET, path: '/x', operation: 'x', wait: async (ms) => { waits.push(ms); } }),
		).rejects.toMatchObject({ status: 429 });
		expect(seen).toHaveLength(3);
		expect(waits).toEqual([2_000, 5_000]);
	});
	test('with a deadline it skips a 429 retry that would not fit and never starts a request past it', async () => {
		const seen = stubFetch(replies([{ status: 429 }, { status: 429 }]));
		const waits: number[] = [];
		await expect(
			smartSuiteClient.request({ credentials, method: HttpMethod.GET, path: '/x', operation: 'x', deadlineAt: Date.now() + 4_000, wait: async (ms) => { waits.push(ms); } }),
		).rejects.toMatchObject({ status: 429 });
		expect(waits).toEqual([2_000]);
		expect(seen).toHaveLength(2);
		await expect(smartSuiteClient.request({ credentials, method: HttpMethod.GET, path: '/x', operation: 'x', deadlineAt: Date.now() - 1 })).rejects.toThrow(/time budget/);
		expect(seen).toHaveLength(2);
	});
	test('pathSegment encodes and rejects empty or dot segments', () => {
		expect(smartSuiteClient.pathSegment({ value: 'a/b?c', label: 'ID' })).toBe('a%2Fb%3Fc');
		expect(() => smartSuiteClient.pathSegment({ value: ' ', label: 'ID' })).toThrow('ID is required.');
		expect(() => smartSuiteClient.pathSegment({ value: '..', label: 'ID' })).toThrow(/not a valid/);
	});
});

describe('paginated list (dropdowns)', () => {
	test('accepts a plain array (live /solutions/ shape) with one request', async () => {
		const seen = stubFetch(() => ({ body: [{ id: 's1', name: 'A' }, { id: 's2', name: 'B' }] }));
		const items = await smartSuitePaginatedApiCall({ apiKey: 'k', accountId: 'a', method: HttpMethod.GET, resourceUri: '/solutions/' });
		expect(items).toEqual([{ id: 's1', name: 'A' }, { id: 's2', name: 'B' }]);
		expect(seen).toHaveLength(1);
	});
	test('follows {results,next} pages and stops when next is null', async () => {
		const seen = stubFetch(replies([{ body: { results: [{ id: 1 }], next: 'x' } }, { body: { results: [{ id: 2 }], next: null } }]));
		const items = await smartSuitePaginatedApiCall({ apiKey: 'k', accountId: 'a', method: HttpMethod.GET, resourceUri: '/comments/' });
		expect(items).toHaveLength(2);
		expect(seen[1].query.get('offset')).toBe('100');
	});
});

describe('auth validate', () => {
	const validate = (params: { auth: { apiKey: string; accountId: string } }): Promise<unknown> => {
		const fn: unknown = Reflect.get(smartsuiteAuth, 'validate');
		if (typeof fn !== 'function') {
			throw new Error('validate missing');
		}
		return Promise.resolve(fn(params));
	};
	test('401 = invalid credentials', async () => {
		stubFetch(() => ({ status: 401, body: {} }));
		await expect(validate({ auth: { apiKey: 'k', accountId: 'a' } })).resolves.toMatchObject({ valid: false, error: expect.stringMatching(/Invalid Credentials/) });
	});
	test('402 = plan has no API access', async () => {
		stubFetch(() => ({ status: 402, body: {} }));
		await expect(validate({ auth: { apiKey: 'k', accountId: 'a' } })).resolves.toMatchObject({ valid: false, error: expect.stringMatching(/no API access/) });
	});
	test('200 = valid', async () => {
		stubFetch(() => ({ body: [] }));
		await expect(validate({ auth: { apiKey: 'k', accountId: 'a' } })).resolves.toEqual({ valid: true });
	});
});
