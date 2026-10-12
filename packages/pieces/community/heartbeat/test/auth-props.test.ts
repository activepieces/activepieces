import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { heartbeatAuth } from '../src/lib/auth';
import { heartbeatProps } from '../src/lib/common/props';
import { Heartbeat } from '../src/index';
import { IDS, replies, runStep, stubFetch, TOKEN } from './helpers';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

type Validate = (params: { auth: string }) => Promise<{ valid: boolean; error?: string }>;
type Options = (params: { auth?: { secret_text: string } }) => Promise<{ disabled: boolean; options: unknown[]; placeholder?: string }>;

function validate(auth: string) {
	const fn: Validate = Reflect.get(heartbeatAuth, 'validate');
	return runStep(fn({ auth }));
}

function options({ prop, auth }: { prop: unknown; auth?: { secret_text: string } }) {
	const fn: Options = Reflect.get(Object(prop), 'options');
	return runStep(fn({ auth }));
}

describe('auth.validate', () => {
	test('valid on GET /roles 200', async () => {
		const seen = stubFetch(replies([{ body: [] }]));
		expect(await validate(` ${TOKEN} `)).toEqual({ valid: true });
		expect(seen[0].path).toBe('/roles');
		expect(seen[0].auth).toBe(`Bearer ${TOKEN}`);
	});
	test('invalid with plan hint on 401', async () => {
		stubFetch(replies([{ status: 401, body: { message: 'Unauthorized' } }]));
		expect(await validate('bad')).toMatchObject({ valid: false, error: expect.stringContaining('Scale plan') });
	});
	test('other errors are reported with the vendor text, not as invalid key', async () => {
		stubFetch(replies([{ status: 500, body: { message: 'boom' } }]));
		const result = await validate('x');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('boom');
		expect(result.error).not.toContain('Invalid API key');
	});
});

describe('dropdowns', () => {
	test('roles dropdown asks for a connection first', async () => {
		expect(await options({ prop: heartbeatProps.roleDropdown })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('connection') });
	});
	test('roles dropdown lists options', async () => {
		stubFetch(replies([{ body: [{ id: IDS.role, name: 'User' }] }]));
		expect(await options({ prop: heartbeatProps.roleDropdown, auth: { secret_text: TOKEN } })).toEqual({ disabled: false, options: [{ label: 'User', value: IDS.role }] });
	});
	test('groups dropdown shows a reason on 401 and 429', async () => {
		stubFetch(replies([{ status: 401, body: {} }]));
		expect(await options({ prop: heartbeatProps.groupsDropdown, auth: { secret_text: TOKEN } })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('rejected') });
		vi.unstubAllGlobals();
		stubFetch(replies([{ status: 429, body: {} }]));
		expect(await options({ prop: heartbeatProps.groupsDropdown, auth: { secret_text: TOKEN } })).toMatchObject({ disabled: true, placeholder: expect.stringContaining('rate limit') });
	});
});

describe('piece metadata', () => {
	test('description, version floor and every action tagged', () => {
		expect(Heartbeat.description).not.toContain('Monitoring');
		expect(Heartbeat.minimumSupportedRelease).toBe('0.88.2');
		const actions = Object.values(Heartbeat.actions());
		expect(actions).toHaveLength(46);
		for (const action of actions) {
			expect(action.audience, action.name).toBeDefined();
			if (action.name !== 'custom_api_call') {
				expect(action.classification, action.name).toBeDefined();
				expect(action.aiMetadata?.description, action.name).toBeTruthy();
				expect(action.name.startsWith('heartbeat_'), action.name).toBe(true);
			}
		}
		const triggers = Object.values(Heartbeat.triggers());
		expect(triggers).toHaveLength(5);
		for (const trigger of triggers) {
			expect(trigger.classification).toBe('READ');
			expect(trigger.aiMetadata?.description).toBeTruthy();
			expect(trigger.sampleData).toBeTruthy();
		}
	});
});
