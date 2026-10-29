import { vi } from 'vitest';

export function stubFetch(responses: FakeResponse[] | ((call: RecordedCall) => FakeResponse)) {
  const calls: RecordedCall[] = [];
  const queue = Array.isArray(responses) ? [...responses] : undefined;
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, key) => {
      headers[key] = value;
    });
    const rawBody =
      typeof init?.body === 'string'
        ? init.body
        : init?.body instanceof Uint8Array
          ? Buffer.from(init.body).toString('utf8')
          : undefined;
    const call: RecordedCall = {
      method: init?.method ?? 'GET',
      url: new URL(String(input)),
      headers,
      rawBody,
      body: parseJson(rawBody),
    };
    calls.push(call);
    const next = queue ? queue.shift() : typeof responses === 'function' ? responses(call) : undefined;
    if (next === undefined) {
      throw new Error(`Unexpected request ${call.method} ${call.url.toString()}`);
    }
    const status = next.status ?? 200;
    const payload = next.body === undefined ? '' : JSON.stringify(next.body);
    return new Response(status === 204 || payload === '' ? null : payload, {
      status,
      headers: { 'content-type': 'application/json' },
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

export function makeContext({ props, extra = {} }: { props: Record<string, unknown>; extra?: Record<string, unknown> }) {
  const auth = { type: 'CUSTOM_AUTH', props: { apiKey: ` ${API_KEY} ` } };
  return {
    auth,
    propsValue: { auth, ...props },
    store: makeStore(),
    ...extra,
  };
}

export async function invoke({ fn, self, args }: { fn: unknown; self: unknown; args: unknown[] }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('not a function');
  }
  return Reflect.apply(fn, self, args);
}

export function toRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  }
  return Object.fromEntries(Object.entries(value));
}

export function toDropdown(value: unknown): { disabled: boolean; placeholder: string | undefined; options: { label: string; value: string }[] } {
  const record = toRecord(value);
  const options = Array.isArray(record['options']) ? record['options'] : [];
  return {
    disabled: record['disabled'] === true,
    placeholder: typeof record['placeholder'] === 'string' ? record['placeholder'] : undefined,
    options: options.map((option) => {
      const item = toRecord(option);
      return { label: String(item['label']), value: String(item['value']) };
    }),
  };
}

function parseJson(raw: string | undefined): unknown {
  if (raw === undefined || raw.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export const API_KEY = 'key_test_123';
export const BASE = 'https://api.retellai.com';

export type RecordedCall = {
  method: string;
  url: URL;
  headers: Record<string, string>;
  rawBody: string | undefined;
  body: unknown;
};

export type FakeResponse = { status?: number; body?: unknown };
