import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export type SeenRequest = {
	url: string;
	method: string;
	path: string;
	query: URLSearchParams;
	auth: string | null;
	accept: string | null;
	body: unknown;
};

export type FakeReply = {
	status?: number;
	body?: unknown;
	text?: string;
	headers?: Record<string, string>;
};

export function stubFetch(respond: (request: SeenRequest, index: number) => FakeReply): SeenRequest[] {
	const seen: SeenRequest[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = input instanceof Request ? input.url : String(input);
			const headers = new Headers(init?.headers);
			const parsed = new URL(url);
			const rawBody = typeof init?.body === 'string' ? init.body : null;
			const request: SeenRequest = {
				url,
				method: (init?.method ?? 'GET').toUpperCase(),
				path: parsed.pathname.replace('/v0', ''),
				query: parsed.searchParams,
				auth: headers.get('authorization'),
				accept: headers.get('accept'),
				body: rawBody ? JSON.parse(rawBody) : null,
			};
			seen.push(request);
			const reply = respond(request, seen.length - 1);
			const payload = reply.status === 204 ? null : (reply.text ?? JSON.stringify(reply.body ?? {}));
			return new Response(payload, {
				status: reply.status ?? 200,
				headers: { 'content-type': reply.text !== undefined ? 'text/plain' : 'application/json', ...(reply.headers ?? {}) },
			});
		}),
	);
	return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
	return (_request, index) => list[Math.min(index, list.length - 1)];
}

export const TOKEN = 'test-token';

export const SERVER = { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', token: 'x' };

export function codaConnection() {
	return { type: AppConnectionType.SECRET_TEXT as const, secret_text: TOKEN };
}

export function actionContext(propsValue: Record<string, unknown>): TestActionContext {
	return { auth: codaConnection(), propsValue, store: memoryStore(), server: SERVER };
}

export function memoryStore(initial: Record<string, unknown> = {}): MemoryStore {
	const data = new Map<string, string>(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
	return {
		read: (key: string): unknown => {
			const raw = data.get(key);
			return raw === undefined ? undefined : JSON.parse(raw);
		},
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

export async function runStep<T>(promise: Promise<T>): Promise<T> {
	const settled = promise.then(
		(value) => ({ ok: true as const, value }),
		(error: unknown) => ({ ok: false as const, error }),
	);
	await vi.runAllTimersAsync();
	const result = await settled;
	if (!result.ok) {
		throw result.error;
	}
	return result.value;
}

export function run({ action, propsValue }: { action: Runnable; propsValue: Record<string, unknown> }): Promise<unknown> {
	return runStep(action.run(actionContext(propsValue)));
}

export function idsOf(items: unknown): unknown[] {
	return Array.isArray(items) ? items.map((item: unknown) => (item !== null && typeof item === 'object' ? Reflect.get(item, 'id') : undefined)) : [];
}

export type MemoryStore = Store & { read: (key: string) => unknown };

type TestActionContext = {
	auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string };
	propsValue: Record<string, unknown>;
	store: Store;
	server: typeof SERVER;
};

type Runnable = { run(context: TestActionContext): Promise<unknown> };

export function triggerContext({ propsValue = {}, body = {}, store = memoryStore() }: { propsValue?: Record<string, unknown>; body?: unknown; store?: ReturnType<typeof memoryStore> }) {
	return {
		auth: { type: 'SECRET_TEXT', secret_text: TOKEN },
		propsValue,
		store,
		webhookUrl: 'https://example.ngrok.dev/api/v1/webhooks/flow123',
		payload: { body, headers: {}, queryParams: {} },
		server: { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', token: 'x' },
	};
}

export const IDS = {
	user: '0fed0eb0-9dc6-41e9-a09d-ea53d3158c3a',
	admin: '871072f3-af66-4fb0-b8a4-49290816d64e',
	group: '13fcd1ac-535f-46b6-bed8-a7eb1b87f96c',
	role: '670577ce-7912-4a4e-b041-50cf578a1f44',
	channel: 'a0bb7f6a-ad62-4ea7-99ac-5079bf0725fe',
	category: '37a94b50-1f50-4e10-ab79-38d5b9c7f043',
	thread: 'e5285d90-ce1b-4620-b9f1-9444ff6f9bea',
	comment: '4f3467f8-7e8a-4c71-8699-2ca6ae806c66',
	chat: '654e5fe6-5208-4ca9-a3c3-ba47d9765d33',
	message: '1ec429d3-86ba-4fec-a0d7-c7dee0e4c8f8',
	event: 'acb92b02-b8cb-4e96-914b-825ac9d416d5',
	invitation: 'b6124913-dc2a-48c7-a9bc-f3e2d251135a',
	lesson: '11111111-2222-4333-8444-555555555555',
	document: '66666666-7777-4888-9999-000000000000',
	webhook: '77777777-8888-4999-aaaa-bbbbbbbbbbbb',
};
