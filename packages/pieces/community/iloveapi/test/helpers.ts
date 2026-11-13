import { Readable } from 'stream';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { vi } from 'vitest';

export type Call = {
  method: string;
  url: string;
  body: unknown;
  headers: Record<string, string>;
  query: unknown;
  redact: boolean | undefined;
  responseType: string | undefined;
  followRedirects: boolean | undefined;
  hasDispatcher: boolean;
};

export type Route = {
  method: string;
  match: (url: string) => boolean;
  status?: number;
  body?: unknown;
  reply?: (call: Call) => { status?: number; body?: unknown; headers?: Record<string, string> };
};

export const SERVER = 'api11.ilovepdf.com';

export function defaultRoutes(overrides: Route[] = []): Route[] {
  return [
    ...overrides,
    { method: 'POST', match: (u) => u === 'https://api.ilovepdf.com/v1/auth', body: { token: 'jwt-1' } },
    {
      method: 'GET',
      match: (u) => /\/v1\/start\//.test(u),
      body: { server: SERVER, task: 'TASK1', remaining_credits: 2400 },
    },
    {
      method: 'POST',
      match: (u) => u === `https://${SERVER}/v1/upload`,
      reply: (call) => ({ body: { server_filename: `sf-${uploadIndex(call)}` } }),
    },
    {
      method: 'POST',
      match: (u) => u === `https://${SERVER}/v1/process`,
      body: {
        download_filename: 'out.pdf',
        filesize: 2000,
        output_filesize: 1000,
        output_filenumber: 1,
        output_extensions: '["pdf"]',
        timer: '0.5',
        status: 'TaskSuccess',
      },
    },
    {
      method: 'GET',
      match: (u) => u.startsWith(`https://${SERVER}/v1/download/`),
      reply: () => ({ body: Readable.from([Buffer.from('RESULT')]), headers: { 'content-type': 'application/pdf' } }),
    },
  ];
}

let uploads = 0;
function uploadIndex(_call: Call): number {
  uploads += 1;
  return uploads;
}

export function mockHttp(routes: Route[]): Call[] {
  uploads = 0;
  const calls: Call[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request, options) => {
    const call: Call = {
      method: request.method,
      url: request.url,
      body: request.body,
      headers: stringRecord(request.headers),
      query: request.queryParams,
      redact: request.redactBodyInErrors,
      responseType: request.responseType,
      followRedirects: request.followRedirects,
      hasDispatcher: Boolean(options && 'dispatcher' in options && options.dispatcher),
    };
    calls.push(call);
    const route = routes.find((r) => r.method === request.method && r.match(request.url));
    if (!route) throw new Error(`unexpected ${request.method} ${request.url}`);
    const result = route.reply ? route.reply(call) : { status: route.status, body: route.body };
    const status = result.status ?? 200;
    if (status >= 400) {
      throw new HttpError('[redacted]', { status, responseBody: result.body });
    }
    return loose({ status, headers: result.headers ?? {}, body: result.body });
  });
  return calls;
}

export function fakeContext(propsValue: Record<string, unknown>) {
  const written: Array<{ fileName: string; data: Buffer }> = [];
  const store = new Map<string, unknown>();
  return {
    written,
    store,
    context: {
      auth: { type: 'SECRET_TEXT', secret_text: ' project_public_abc ' },
      propsValue,
      files: {
        write: vi.fn(async ({ fileName, data }: { fileName: string; data: Buffer }) => {
          written.push({ fileName, data });
          return `https://files.example/${fileName}`;
        }),
      },
      store: {
        get: vi.fn(async (key: string) => store.get(key) ?? null),
        put: vi.fn(async (key: string, value: unknown) => {
          store.set(key, value);
          return value;
        }),
        delete: vi.fn(async (key: string) => {
          store.delete(key);
        }),
      },
    },
  };
}

export const pdf = { base64: Buffer.from('%PDF-1.4').toString('base64'), filename: 'in.pdf', extension: 'pdf' };
export const png = { base64: Buffer.from('PNG').toString('base64'), filename: 'in.png', extension: 'png' };

export function processBody(calls: Call[]): Record<string, unknown> {
  const call = calls.find((c) => c.url.endsWith('/v1/process'));
  if (!call) throw new Error('no process call');
  return record(call.body);
}

export function run(action: { run: (ctx: never) => Promise<unknown> }) {
  return async (context: unknown): Promise<Record<string, unknown>> => record(await action.run(loose(context)));
}

export function loose(value: unknown): never {
  return Reflect.get({ value }, 'value');
}

export function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object') throw new Error('expected an object');
  return Object.fromEntries(Object.entries(value));
}

function stringRecord(value: unknown): Record<string, string> {
  if (value === null || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, String(v)]));
}
