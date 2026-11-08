import { vi } from 'vitest';

export type SeenRequest = {
	url: string;
	method: string;
	path: string;
	query: URLSearchParams;
	headers: Headers;
	body: unknown;
};

export type FakeReply = {
	status?: number;
	body?: unknown;
	headers?: Record<string, string>;
};

export function stubFetch(respond: (request: SeenRequest, index: number) => FakeReply): SeenRequest[] {
	const seen: SeenRequest[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = input instanceof Request ? input.url : String(input);
			const parsed = new URL(url);
			const rawBody = typeof init?.body === 'string' ? init.body : null;
			const request: SeenRequest = {
				url,
				method: (init?.method ?? 'GET').toUpperCase(),
				path: parsed.pathname.replace('/api/v1', ''),
				query: parsed.searchParams,
				headers: new Headers(init?.headers),
				body: rawBody ? JSON.parse(rawBody) : null,
			};
			seen.push(request);
			const reply = respond(request, seen.length - 1);
			return new Response(JSON.stringify(reply.body ?? {}), {
				status: reply.status ?? 200,
				headers: { 'content-type': 'application/json', ...(reply.headers ?? {}) },
			});
		}),
	);
	return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
	return (_request, index) => list[Math.min(index, list.length - 1)];
}

export const AUTH = { type: 'CUSTOM_AUTH', props: { apiKey: ' key-123 ', accountId: 'acct1' } };

export function memoryStore(initial: Record<string, unknown> = {}): MemoryStore {
	const data = new Map<string, string>(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
	return {
		snapshot: (): Record<string, unknown> => Object.fromEntries(Array.from(data.entries()).map(([key, raw]) => [key, JSON.parse(raw)])),
		put: async <T>(key: string, value: T): Promise<T> => {
			data.set(key, JSON.stringify(value));
			return value;
		},
		get: async <T>(key: string): Promise<T | null> => {
			const raw = data.get(key);
			return raw === undefined ? null : JSON.parse(raw);
		},
		delete: async (key: string): Promise<void> => {
			data.delete(key);
		},
	};
}

export function run(action: Runnable) {
	return (propsValue: Record<string, unknown>): Promise<unknown> => action.run({ auth: AUTH, propsValue });
}

export function field({ value, key }: { value: unknown; key: string }): unknown {
	return value !== null && typeof value === 'object' ? Reflect.get(value, key) : undefined;
}

export type MemoryStore = {
	snapshot: () => Record<string, unknown>;
	put: <T>(key: string, value: T) => Promise<T>;
	get: <T>(key: string) => Promise<T | null>;
	delete: (key: string) => Promise<void>;
};

type TestActionContext = { auth: typeof AUTH; propsValue: Record<string, unknown> };

type Runnable = { run(context: TestActionContext): Promise<unknown> };
