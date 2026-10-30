import { Readable } from 'node:stream';
import { vi } from 'vitest';

export const API_KEY = 'dg-test-key';

export function stubFetch(
  respond: (request: SeenRequest, index: number) => FakeReply
): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      const raw = init?.body;
      const isStream = raw instanceof Readable;
      const bytes = isStream ? await readAll(raw) : null;
      const text = typeof raw === 'string' ? raw : null;
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        headers: new Headers(init?.headers),
        json: text ? JSON.parse(text) : null,
        streamed: isStream,
        bytes,
        dispatcher: Reflect.get(Object(init), 'dispatcher'),
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      const body =
        reply.binary !== undefined
          ? reply.binary
          : reply.text !== undefined
          ? reply.text
          : reply.body === undefined
          ? null
          : JSON.stringify(reply.body);
      return new Response(body, {
        status: reply.status ?? 200,
        headers: reply.headers ?? { 'content-type': 'application/json' },
      });
    })
  );
  return seen;
}

async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export function context(propsValue: Record<string, unknown>) {
  return {
    auth: { secret_text: API_KEY, type: 'SECRET_TEXT' },
    propsValue,
    store: {},
    files: {
      write: vi.fn(
        async ({ fileName }: { fileName: string }) =>
          `https://files.test/${fileName}`
      ),
    },
    server: { apiUrl: '', publicUrl: '', token: '' },
    run: { id: 'run-1' },
    step: { name: 'step_1' },
  };
}

export async function runAction({
  action,
  propsValue,
}: {
  action: unknown;
  propsValue: Record<string, unknown>;
}): Promise<unknown> {
  const run = Reflect.get(Object(action), 'run');
  return run(context(propsValue));
}

export type SeenRequest = {
  url: string;
  method: string;
  headers: Headers;
  json: unknown;
  streamed: boolean;
  bytes: Buffer | null;
  dispatcher: unknown;
};

export type FakeReply = {
  status?: number;
  body?: unknown;
  text?: string;
  binary?: Uint8Array;
  headers?: Record<string, string>;
};
