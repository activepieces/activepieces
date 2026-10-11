import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { intercomClient } from '../src/lib/common';
import {
	intercomHttpInternals,
	encodePath,
	getIntercomBaseUrl,
	intercomRequest,
	IntercomApiError,
} from '../src/lib/common/client';
import { intercom } from '../src/index';
import { intercomAuth } from '../src/lib/auth';
import { callWith, customAuth, oauthAuth, stubIntercom } from './helpers';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('region allowlist', () => {
	test.each([
		['intercom', 'https://api.intercom.io'],
		['eu.intercom', 'https://api.eu.intercom.io'],
		['au.intercom', 'https://api.au.intercom.io'],
		[undefined, 'https://api.intercom.io'],
		['', 'https://api.intercom.io'],
	])('%s maps to %s', (region, url) => {
		expect(getIntercomBaseUrl(region)).toBe(url);
	});

	test.each(['evil.com/#', 'intercom.io.evil', 'eu.intercom.evil.io/x', 'EU.intercom', 'constructor', 'toString'])(
		'rejects lookalike region %s before any request',
		async (region) => {
			const seen = stubIntercom([]);
			expect(() => getIntercomBaseUrl(region)).toThrow('Unsupported Intercom region');
			await expect(
				intercomRequest({ auth: customAuth(region), method: HttpMethod.GET, path: ['me'], operation: 'x' }),
			).rejects.toThrow('Unsupported Intercom region');
			expect(seen).toHaveLength(0);
		},
	);

	test('custom API call base URL uses the allowlist', async () => {
		const action = intercom.actions()['custom_api_call'];
		const urlProps: (input: { auth: unknown }, ctx: unknown) => Promise<Record<string, { defaultValue?: unknown }>> =
			Reflect.get(action.props['url'], 'props');
		const fields = await urlProps({ auth: customAuth('eu.intercom') }, {});
		expect(fields['url'].defaultValue).toBe('https://api.eu.intercom.io');
		await expect(Promise.resolve().then(() => urlProps({ auth: customAuth('evil.com/#') }, {}))).rejects.toThrow(
			'Unsupported Intercom region',
		);
	});
});

describe('intercomRequest', () => {
	test('sends bearer token, Intercom-Version 2.11, JSON accept and the TLS dispatcher', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/contacts/abc', reply: { body: { id: 'abc' } } }]);
		const body = await intercomRequest({
			auth: customAuth('eu.intercom'),
			method: HttpMethod.GET,
			path: ['contacts', 'abc'],
			operation: 'get the contact',
		});
		expect(body).toEqual({ id: 'abc' });
		expect(seen[0].url).toBe('https://api.eu.intercom.io/contacts/abc');
		expect(seen[0].headers.get('authorization')).toBe('Bearer TOKEN-123');
		expect(seen[0].headers.get('intercom-version')).toBe('2.11');
		expect(seen[0].headers.get('accept')).toBe('application/json');
		expect(seen[0].dispatcher).toBeDefined();
	});

	test('oauth connection without region goes to the US host with the oauth token', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/me', reply: { body: { id: '1' } } }]);
		await intercomRequest({ auth: oauthAuth(), method: HttpMethod.GET, path: ['me'], operation: 'x' });
		expect(seen[0].url).toBe('https://api.intercom.io/me');
		expect(seen[0].headers.get('authorization')).toBe('Bearer OAUTH-TOKEN');
	});

	test('encodes path segments and refuses empty or dot segments', () => {
		expect(encodePath(['contacts', 'a/b?c#d'])).toBe('contacts/a%2Fb%3Fc%23d');
		expect(() => encodePath(['contacts', ''])).toThrow('empty or invalid');
		expect(() => encodePath(['contacts', '..'])).toThrow('empty or invalid');
		expect(() => encodePath(['contacts', ' . '])).toThrow('empty or invalid');
	});

	test('error carries status, code and responseBody, never body', async () => {
		stubIntercom([
			{
				method: 'GET',
				path: '/tickets/9',
				reply: { status: 404, body: { type: 'error.list', errors: [{ code: 'ticket_not_found', message: 'Ticket not found' }] } },
			},
		]);
		const error = await intercomRequest({
			auth: customAuth(),
			method: HttpMethod.GET,
			path: ['tickets', '9'],
			operation: 'get the ticket',
		}).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(IntercomApiError);
		if (!(error instanceof IntercomApiError)) {
			throw new Error('expected an IntercomApiError');
		}
		const apiError = error;
		expect(apiError.message).toBe('Intercom get the ticket failed (404): Ticket not found');
		expect(apiError.status).toBe(404);
		expect(apiError.code).toBe('ticket_not_found');
		expect(apiError.responseBody).toEqual({ type: 'error.list', errors: [{ code: 'ticket_not_found', message: 'Ticket not found' }] });
		expect('body' in apiError).toBe(false);
	});

	test('long vendor messages are cut to 500 characters and 403 adds a permission hint', async () => {
		stubIntercom([
			{ method: 'GET', path: '/admins', reply: { status: 403, body: { errors: [{ code: 'forbidden', message: 'x'.repeat(900) }] } } },
		]);
		const error = await intercomRequest({
			auth: customAuth(),
			method: HttpMethod.GET,
			path: ['admins'],
			operation: 'list admins',
		}).catch((e: unknown) => e);
		if (!(error instanceof Error)) {
			throw new Error('expected an Error');
		}
		expect(error.message).toContain(`${'x'.repeat(500)}...`);
		expect(error.message).not.toContain('x'.repeat(501));
		expect(error.message).toContain('lacks the permission');
	});

	test('a 403 action_forbidden business rule gets no permission hint', async () => {
		stubIntercom([
			{
				method: 'POST',
				path: '/messages',
				reply: {
					status: 403,
					body: { errors: [{ code: 'action_forbidden', message: 'One or more users are unsubscribed from emails' }] },
				},
			},
		]);
		const error = await intercomRequest({
			auth: customAuth(),
			method: HttpMethod.POST,
			path: ['messages'],
			body: {},
			operation: 'send the message',
		}).catch((e: unknown) => e);
		if (!(error instanceof Error)) {
			throw new Error('expected an Error');
		}
		expect(error.message).toBe('Intercom send the message failed (403): One or more users are unsubscribed from emails');
	});

	test('POST is never retried on 5xx', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/conversations/1/reply', reply: { status: 502, body: { errors: [{ code: 'bad_gateway' }] } } }]);
		await expect(
			intercomRequest({
				auth: customAuth(),
				method: HttpMethod.POST,
				path: ['conversations', '1', 'reply'],
				body: { body: 'hi' },
				operation: 'reply',
			}),
		).rejects.toThrow('(502)');
		expect(seen).toHaveLength(1);
	});

	test('GET is retried on 503 and every method on 429, at most twice', async () => {
		const getSeen = stubIntercom([
			{ method: 'GET', path: '/tags', reply: (_r, all) => (all.length < 3 ? { status: 503, body: {} } : { body: { data: [] } }) },
		]);
		await intercomRequest({ auth: customAuth(), method: HttpMethod.GET, path: ['tags'], operation: 'list tags' });
		expect(getSeen).toHaveLength(3);
		vi.unstubAllGlobals();
		const postSeen = stubIntercom([{ method: 'POST', path: '/tags', reply: { status: 429, body: {} } }]);
		await expect(
			intercomRequest({ auth: customAuth(), method: HttpMethod.POST, path: ['tags'], body: { name: 'a' }, operation: 'create tag' }),
		).rejects.toThrow('(429)');
		expect(postSeen).toHaveLength(3);
	});
});

describe('SDK client', () => {
	test('routes SDK calls through the same HTTP layer, with 2.11 and no POST retry', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/contacts/c1/notes', reply: { status: 500, body: { errors: [{ code: 'server_error' }] } } }]);
		const client = await intercomClient(customAuth('au.intercom'));
		await expect(client.notes.create({ contact_id: 'c1', body: 'hello' })).rejects.toThrow('500');
		expect(seen).toHaveLength(1);
		expect(seen[0].url).toBe('https://api.au.intercom.io/contacts/c1/notes');
		expect(seen[0].headers.get('intercom-version')).toBe('2.11');
		expect(seen[0].dispatcher).toBeDefined();
	});

	test('SDK returns the raw response body on success', async () => {
		stubIntercom([{ method: 'GET', path: '/tags', reply: { body: { type: 'list', data: [{ type: 'tag', id: '1', name: 'VIP' }] } } }]);
		const client = await intercomClient(customAuth());
		expect(await client.tags.list()).toEqual({ type: 'list', data: [{ type: 'tag', id: '1', name: 'VIP' }] });
	});
});

describe('access token validate', () => {
	const validate = (region: string) => {
		const validateFn = intercomAuth[1].validate;
		if (validateFn === undefined) {
			throw new Error('validate is not defined');
		}
		return callWith({ fn: validateFn, ctx: { auth: { accessToken: 'T', region } } });
	};

	test('401 says invalid token or region; 500 does not blame the credentials', async () => {
		stubIntercom([{ method: 'GET', path: '/me', reply: { status: 401, body: { errors: [{ code: 'unauthorized' }] } } }]);
		expect(await validate('intercom')).toEqual({ valid: false, error: 'Invalid access token or wrong region. Check both and try again.' });
		vi.unstubAllGlobals();
		stubIntercom([{ method: 'GET', path: '/me', reply: { status: 500, body: {} } }]);
		expect(await validate('intercom')).toEqual({ valid: false, error: 'Could not validate the connection. Intercom answered with HTTP 500.' });
	});

	test('valid token passes and sends the version header; lookalike region never sends the token', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/me', reply: { body: { id: '1' } } }]);
		expect(await validate('au.intercom')).toEqual({ valid: true });
		expect(seen[0].url).toBe('https://api.au.intercom.io/me');
		expect(seen[0].headers.get('intercom-version')).toBe('2.11');
		vi.unstubAllGlobals();
		const none = stubIntercom([]);
		expect((await validate('evil.com/#')).valid).toBe(false);
		expect(none).toHaveLength(0);
	});
});

describe('network errors', () => {
	test('GET retries a dropped connection; POST does not', async () => {
		let calls = 0;
		vi.spyOn(intercomHttpInternals, 'sleep').mockResolvedValue(undefined);
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				calls += 1;
				if (calls === 1) {
					throw new TypeError('fetch failed');
				}
				return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'content-type': 'application/json' } });
			}),
		);
		await intercomRequest({ auth: customAuth(), method: HttpMethod.GET, path: ['tags'], operation: 'list tags' });
		expect(calls).toBe(2);
		calls = 0;
		await expect(
			intercomRequest({ auth: customAuth(), method: HttpMethod.POST, path: ['tags'], body: { name: 'a' }, operation: 'create tag' }),
		).rejects.toThrow('fetch failed');
		expect(calls).toBe(1);
	});
	test('network errors and 503s share one budget of three GET attempts', async () => {
		let calls = 0;
		vi.spyOn(intercomHttpInternals, 'sleep').mockResolvedValue(undefined);
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => {
				calls += 1;
				if (calls % 2 === 1) {
					throw new TypeError('fetch failed');
				}
				return new Response(JSON.stringify({}), { status: 503, headers: { 'content-type': 'application/json' } });
			}),
		);
		await expect(
			intercomRequest({ auth: customAuth(), method: HttpMethod.GET, path: ['tags'], operation: 'list tags' }),
		).rejects.toThrow('fetch failed');
		expect(calls).toBe(3);
	});
});
