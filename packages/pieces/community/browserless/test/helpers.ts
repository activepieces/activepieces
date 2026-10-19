import { createMockActionContext } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export function stubFetch(respond: (request: SeenRequest, index: number) => FakeReply): SeenRequest[] {
    const seen: SeenRequest[] = [];
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
            const url = input instanceof Request ? input.url : String(input);
            const parsed = new URL(url);
            const headers = new Headers(init?.headers);
            const rawBody = typeof init?.body === 'string' ? init.body : null;
            const request: SeenRequest = {
                url,
                origin: parsed.origin,
                method: (init?.method ?? 'GET').toUpperCase(),
                path: parsed.pathname,
                query: parsed.searchParams,
                headers,
                redirect: init?.redirect ?? null,
                body: rawBody ? JSON.parse(rawBody) : null,
            };
            seen.push(request);
            const reply = respond(request, seen.length - 1);
            if (reply.throws) {
                throw reply.throws;
            }
            const payload = reply.binary ?? reply.text ?? JSON.stringify(reply.body ?? {});
            const contentType = reply.binary ? 'application/octet-stream' : reply.text !== undefined ? 'text/html' : 'application/json';
            return new Response(payload, {
                status: reply.status ?? 200,
                headers: { 'content-type': contentType, ...(reply.headers ?? {}) },
            });
        }),
    );
    return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
    return (_request, index) => list[Math.min(index, list.length - 1)];
}

export function auth(overrides: Partial<AuthProps> = {}) {
    return {
        type: 'CUSTOM_AUTH' as const,
        props: { apiToken: TOKEN, region: 'https://production-sfo.browserless.io', customBaseUrl: '', ...overrides },
    };
}

export function actionContext({ propsValue, authProps }: { propsValue: Record<string, unknown>; authProps?: Partial<AuthProps> }) {
    const written: WrittenFile[] = [];
    const base = createMockActionContext({ propsValue });
    return {
        written,
        context: {
            ...base,
            auth: auth(authProps),
            propsValue,
            files: {
                write: async ({ fileName, data }: { fileName: string; data: Buffer }) => {
                    written.push({ fileName, data });
                    return `https://files.example/${fileName}`;
                },
            },
        },
    };
}

export function resolvePath({ value, path }: { value: unknown; path: string }): unknown {
    if (path === '') {
        return value;
    }
    return path.split('.').reduce<unknown>((current, segment) => {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        return Reflect.get(current, segment);
    }, value);
}

export function missingSchemaPaths({ output, fields }: { output: unknown; fields: SchemaField[] }): string[] {
    return fields.flatMap((field) => {
        const path = field.value ?? field.key;
        const resolved = resolvePath({ value: output, path });
        if (resolved === undefined) {
            return [path];
        }
        if (field.children && resolved !== null && typeof resolved === 'object' && !Array.isArray(resolved)) {
            return missingSchemaPaths({ output: resolved, fields: field.children }).map((child) => `${path}.${child}`);
        }
        if (field.listItems && Array.isArray(resolved) && resolved.length > 0) {
            return missingSchemaPaths({ output: resolved[0], fields: field.listItems }).map((child) => `${path}[].${child}`);
        }
        return [];
    });
}

export async function runAction({ action, propsValue, authProps }: { action: Runnable; propsValue: Record<string, unknown>; authProps?: Partial<AuthProps> }) {
    const { context, written } = actionContext({ propsValue, authProps });
    const output = await action.run(context);
    return { output, written };
}

export const TOKEN = 'bl-test-token';

export type SchemaField = { key: string; value?: string; children?: SchemaField[]; listItems?: SchemaField[] };

export type AuthProps = { apiToken: string; region: string; customBaseUrl: string };

export type WrittenFile = { fileName: string; data: Buffer };

export type SeenRequest = {
    url: string;
    origin: string;
    method: string;
    path: string;
    query: URLSearchParams;
    headers: Headers;
    redirect: string | null;
    body: unknown;
};

export type FakeReply = {
    status?: number;
    body?: unknown;
    text?: string;
    binary?: Buffer;
    headers?: Record<string, string>;
    throws?: Error;
};
type Runnable = { run(context: ReturnType<typeof actionContext>['context']): Promise<unknown> };
