import { vi } from 'vitest';

export type RecordedCall = {
	method: string;
	url: URL;
	headers: Record<string, string>;
	body: unknown;
};

export type FakeResponse = {
	status?: number;
	body?: unknown;
	contentType?: string;
	raw?: Buffer | string;
};

export function stubFetch(responses: FakeResponse[] | ((call: RecordedCall) => FakeResponse)) {
	const calls: RecordedCall[] = [];
	const queue = Array.isArray(responses) ? [...responses] : undefined;
	const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
		const headers: Record<string, string> = {};
		new Headers(init?.headers).forEach((value, key) => {
			headers[key] = value;
		});
		const rawBody = typeof init?.body === 'string' ? init.body : undefined;
		const call: RecordedCall = {
			method: init?.method ?? 'GET',
			url: new URL(String(input)),
			headers,
			body: rawBody === undefined ? undefined : JSON.parse(rawBody),
		};
		calls.push(call);
		const next = queue ? queue.shift() : typeof responses === 'function' ? responses(call) : undefined;
		if (next === undefined) {
			throw new Error(`Unexpected request ${call.method} ${call.url.toString()}`);
		}
		const status = next.status ?? 200;
		if (next.raw !== undefined) {
			return new Response(next.raw, {
				status,
				headers: { 'content-type': next.contentType ?? 'application/octet-stream' },
			});
		}
		const payload = next.body === undefined ? '' : JSON.stringify(next.body);
		return new Response(status === 204 ? null : payload, {
			status,
			headers: { 'content-type': next.contentType ?? 'application/json' },
		});
	});
	vi.stubGlobal('fetch', fetchMock);
	return calls;
}

export function makeStore() {
	const data = new Map<string, unknown>();
	return {
		data,
		get: vi.fn(async (key: string) => (data.has(key) ? data.get(key) : null)),
		put: vi.fn(async (key: string, value: unknown) => {
			data.set(key, value);
			return value;
		}),
		delete: vi.fn(async (key: string) => {
			data.delete(key);
		}),
	};
}

export function makeContext({
	props,
	extra = {},
}: {
	props: Record<string, unknown>;
	extra?: Record<string, unknown>;
}) {
	const auth = { type: 'SECRET_TEXT', secret_text: API_KEY };
	return {
		auth,
		propsValue: { auth, ...props },
		store: makeStore(),
		files: {
			write: vi.fn(async ({ fileName }: { fileName: string }) => `https://files.example/${fileName}`),
		},
		...extra,
	};
}

export const API_KEY = 'lm-test-key';
export const BASE = 'https://api.lemlist.com/api';
