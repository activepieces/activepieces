import { vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { ninjapipe } from '../src';

export const BASE = 'https://www.ninjapipe.app/api';

export function auth() {
  return { type: 'CUSTOM_AUTH', props: { base_url: `${BASE}/`, api_key: ' np_test ' } };
}

export function jsonResponse({ status, body }: { status: number; body: unknown }) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': typeof body === 'string' ? 'text/html' : 'application/json' },
  });
}

export function stubFetch({ responses }: { responses: { status: number; body: unknown }[] }) {
  let call = 0;
  const fetchMock = vi.fn(async () => {
    const response = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return jsonResponse(response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function request({ fetchMock, call = 0 }: { fetchMock: ReturnType<typeof vi.fn>; call?: number }) {
  const [input, init] = fetchMock.mock.calls[call] ?? [];
  const url = new URL(typeof input === 'string' ? input : String(input));
  const raw = init?.body;
  return {
    url,
    path: url.pathname.replace('/api', ''),
    query: Object.fromEntries(url.searchParams.entries()),
    method: init?.method,
    headers: new Headers(init?.headers),
    body: typeof raw === 'string' && raw.length > 0 ? JSON.parse(raw) : raw,
  };
}

export function runAction({ name, propsValue }: { name: string; propsValue: Record<string, unknown> }): Promise<unknown> {
  const action = ninjapipe.getAction(name);
  if (!action) throw new Error(`Unknown action ${name}`);
  const context = { ...createMockActionContext({ propsValue: {} }), propsValue, auth: auth() };
  return Reflect.apply(action.run, action, [context]);
}

export async function loadOptions({ action, prop, propsValue = {}, ctx = {} }: { action: string; prop: string; propsValue?: Record<string, unknown>; ctx?: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const property: unknown = ninjapipe.getAction(action)?.props[prop];
  const options: unknown = typeof property === 'object' && property !== null ? Reflect.get(property, 'options') : undefined;
  if (typeof options !== 'function') throw new Error(`${action}.${prop} has no options`);
  const state: unknown = await Reflect.apply(options, property, [{ auth: auth(), ...propsValue }, ctx]);
  if (typeof state !== 'object' || state === null) throw new Error('options returned nothing');
  return Object.fromEntries(Object.entries(state));
}

export function ids(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('expected an array');
  return value.map((item: unknown) => String(typeof item === 'object' && item !== null ? Reflect.get(item, 'id') : item));
}

export function memoryStore({ initial = {} }: { initial?: Record<string, unknown> } = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    store: {
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      get: async (key: string): Promise<unknown> => (data.has(key) ? data.get(key) : null),
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

export function runHook({ name, hook, context }: { name: string; hook: 'run' | 'test' | 'onEnable'; context: Record<string, unknown> }): Promise<unknown> {
  const trigger = ninjapipe.getTrigger(name);
  if (!trigger) throw new Error(`Unknown trigger ${name}`);
  const fn: unknown = Reflect.get(trigger, hook);
  if (typeof fn !== 'function') throw new Error(`Trigger has no ${hook}`);
  return Reflect.apply(fn, trigger, [{ auth: auth(), files: { write: async () => 'file-url' }, ...context }]);
}

export function page({ data, page = 1, pages = 1, total }: { data: unknown[]; page?: number; pages?: number; total?: number }) {
  return { data, pagination: { page, limit: 100, total: total ?? data.length, pages } };
}
