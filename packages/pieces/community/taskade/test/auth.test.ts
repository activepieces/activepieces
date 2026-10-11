import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { taskadeAuth } from '../src/lib/auth';
import { runStep, stubFetch } from './helpers';

const server = { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', mintOidcToken: async () => 'oidc-token' };

function validate(auth: string) {
	const check = taskadeAuth.validate;
	if (!check) {
		throw new Error('taskadeAuth has no validate');
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

describe('taskadeAuth.validate', () => {
	test('valid token calls GET /v1/workspaces with the same trimmed bearer header as actions', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [] } }));
		await expect(validate(' tskdp_x ')).resolves.toEqual({ valid: true });
		expect(seen[0].url).toBe('https://www.taskade.com/api/v1/workspaces');
		expect(seen[0].auth).toBe('Bearer tskdp_x');
	});
	test.each([401, 403])('%s means invalid token', async (status) => {
		stubFetch(() => ({ status, body: { ok: false, message: 'Unauthorized' } }));
		await expect(validate('bad')).resolves.toMatchObject({ valid: false, error: expect.stringContaining('Invalid personal access token') });
	});
	test('other failures are reported without calling the token invalid', async () => {
		stubFetch(() => ({ status: 500, body: { ok: false, message: 'boom' } }));
		const result = await validate('tok');
		expect(result).toMatchObject({ valid: false });
		expect(JSON.stringify(result)).not.toContain('Invalid personal access token');
		expect(JSON.stringify(result)).toContain('boom');
	});
});
