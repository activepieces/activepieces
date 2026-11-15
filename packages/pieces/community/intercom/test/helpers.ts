import { AppConnectionType } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { IntercomAuthValue, intercomHttpInternals } from '../src/lib/common/client';

export function customAuth(region = 'intercom'): IntercomAuthValue {
	return {
		type: AppConnectionType.CUSTOM_AUTH,
		props: { accessToken: 'TOKEN-123', region },
	};
}

export function oauthAuth(region?: string): IntercomAuthValue {
	return {
		type: AppConnectionType.OAUTH2,
		access_token: 'OAUTH-TOKEN',
		client_id: 'client',
		client_secret: 'secret',
		redirect_url: 'http://localhost/redirect',
		token_type: 'Bearer',
		claimed_at: 0,
		refresh_token: 'refresh',
		scope: '',
		token_url: 'https://api.intercom.io/auth/eagle/token',
		data: {},
		props: region === undefined ? {} : { region },
	};
}

export function stubIntercom(routes: Route[]): Seen[] {
	const seen: Seen[] = [];
	vi.spyOn(intercomHttpInternals, 'sleep').mockResolvedValue(undefined);
	vi.spyOn(console, 'error').mockImplementation(() => undefined);
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: string | URL | Request, init?: RequestInit & { dispatcher?: unknown }) => {
			const url = new URL(input instanceof Request ? input.url : String(input));
			const method = (init?.method ?? 'GET').toUpperCase();
			const headers = new Headers(init?.headers);
			const rawBody = typeof init?.body === 'string' ? init.body : undefined;
			const entry: Seen = {
				method,
				url: url.toString(),
				path: url.pathname,
				query: Object.fromEntries(url.searchParams.entries()),
				headers,
				body: rawBody === undefined ? undefined : JSON.parse(rawBody),
				dispatcher: init?.dispatcher,
			};
			seen.push(entry);
			const route = routes.find(
				(candidate) =>
					candidate.method === method &&
					(typeof candidate.path === 'string' ? candidate.path === url.pathname : candidate.path.test(url.pathname)),
			);
			if (route === undefined) {
				return new Response(JSON.stringify({ type: 'error.list', errors: [{ code: 'not_found', message: 'no stub' }] }), {
					status: 404,
					headers: { 'content-type': 'application/json' },
				});
			}
			const reply = typeof route.reply === 'function' ? route.reply(entry, seen) : route.reply;
			return new Response(reply.body === undefined ? '' : JSON.stringify(reply.body), {
				status: reply.status ?? 200,
				headers: { 'content-type': 'application/json' },
			});
		}),
	);
	return seen;
}

export async function runAction<T extends { run: (ctx: never) => Promise<unknown> }>({
	action,
	props,
	auth = customAuth(),
}: {
	action: T;
	props: Record<string, unknown>;
	auth?: unknown;
}): Promise<unknown> {
	const context = { auth, propsValue: props, server: { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', token: 't' } };
	return callWith({ fn: action.run, ctx: context });
}

export function callWith<R>({ fn, ctx }: { fn: (ctx: never) => R; ctx: unknown }): R {
	return Reflect.apply(fn, undefined, [ctx]);
}

export const ME = { type: 'admin', id: '991', name: 'Pat Lee', email: 'pat@acme.com', app: { id_code: 'app1', name: 'Acme' } };

export type Reply = { status?: number; body?: unknown };

export type Route = {
	method: string;
	path: string | RegExp;
	reply: Reply | ((request: Seen, all: Seen[]) => Reply);
};

export type Seen = {
	method: string;
	url: string;
	path: string;
	query: Record<string, string>;
	headers: Headers;
	body: unknown;
	dispatcher: unknown;
};
