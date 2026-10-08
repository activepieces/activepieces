import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { codaAuth } from '../src/lib/auth';
import { runStep, stubFetch } from './helpers';

const server = { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', mintOidcToken: async () => 'oidc-token' };

function validate(auth: string) {
	const check = codaAuth.validate;
	if (!check) {
		throw new Error('codaAuth has no validate');
	}
	return runStep(check({ auth, server }));
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('codaAuth.validate', () => {
	test('valid token calls /whoami with the trimmed bearer token', async () => {
		const seen = stubFetch(() => ({ body: { name: 'A' } }));
		await expect(validate(' tok ')).resolves.toEqual({ valid: true });
		expect(seen[0].path).toBe('/whoami');
		expect(seen[0].auth).toBe('Bearer tok');
	});
	test.each([401, 403])('%s → invalid token', async (status) => {
		stubFetch(() => ({ status, body: { message: 'Unauthorized' } }));
		await expect(validate('bad')).resolves.toEqual({ valid: false, error: expect.stringMatching(/Invalid API token/) });
	});
	test('other errors keep their message', async () => {
		stubFetch(() => ({ status: 500, body: { message: 'Coda is down' } }));
		await expect(validate('tok')).resolves.toEqual({ valid: false, error: expect.stringMatching(/Coda is down/) });
	});
});
