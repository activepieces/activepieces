import { AppConnectionType } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';

export const API_KEY = 'key_test_123';

export function auth() {
	return { type: AppConnectionType.SECRET_TEXT, secret_text: ` ${API_KEY} ` };
}

export function runAction({
	action,
	propsValue,
	written = [],
}: {
	action: { run: (context: never) => Promise<unknown> };
	propsValue: Record<string, unknown>;
	written?: { fileName: string; size: number }[];
}): Promise<unknown> {
	const base = createMockActionContext({ propsValue: {} });
	const context = {
		...base,
		propsValue,
		auth: auth(),
		files: {
			...base.files,
			write: async ({ fileName, data }: { fileName: string; data: Buffer }) => {
				written.push({ fileName, size: data.byteLength });
				return `https://files.example/${fileName}`;
			},
		},
	};
	return Reflect.apply(action.run, action, [context]);
}

export function jsonResponse({ status = 200, body, headers = {} }: { status?: number; body: unknown; headers?: Record<string, string> }): Response {
	return new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json', ...headers },
	});
}

export function binaryResponse({ data, headers = {} }: { data: Buffer; headers?: Record<string, string> }): Response {
	return new Response(new Uint8Array(data), { status: 200, headers: { 'content-type': 'application/pdf', ...headers } });
}

export function installFetch() {
	const fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

export function requestOf({ fetchMock, call }: { fetchMock: ReturnType<typeof vi.fn>; call: number }) {
	const [input, init] = fetchMock.mock.calls[call];
	const headers = new Headers(init?.headers);
	const rawBody = init?.body;
	const body = typeof rawBody === 'string' ? safeJson(rawBody) : rawBody;
	return { url: String(input), method: String(init?.method ?? 'GET'), headers: Object.fromEntries(headers.entries()), body, redirect: init?.redirect };
}

export const STORAGE_URL = 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/abc/result.pdf?X-Amz-Expires=3600';

export function okFileResult(overrides: Record<string, unknown> = {}) {
	return {
		url: STORAGE_URL,
		pageCount: 2,
		error: false,
		status: 200,
		name: 'result.pdf',
		credits: 4,
		remainingCredits: 9000,
		outputLinkValidTill: '2026-10-05T20:00:00Z',
		duration: 120,
		...overrides,
	};
}

function safeJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
