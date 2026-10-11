import { vi } from 'vitest';

export const API_KEY = 'flowlu-test-key-123';
export const AUTH = {
  type: 'CUSTOM_AUTH',
  props: { domain: 'example', apiKey: API_KEY },
};
export const BASE = 'https://example.flowlu.com/api/v1/module';

export const sendRequest = vi.fn();

export function ok(body: unknown) {
  okWithStatus({ body, status: 200 });
}

export function okWithStatus({
  body,
  status,
}: {
  body: unknown;
  status: number;
}) {
  sendRequest.mockResolvedValueOnce({ status, headers: {}, body });
}

export function fail({
  status,
  body = {},
}: {
  status: number;
  body?: unknown;
}) {
  sendRequest.mockRejectedValueOnce(new FakeHttpError({ status, body }));
}

export function request(index: number): {
  method: string;
  url: string;
  headers?: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  followRedirects?: boolean;
} {
  return sendRequest.mock.calls[index][0];
}

export function form(index: number): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(request(index).body ?? ''));
}

export function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    store: {
      put: async <T>(key: string, value: T) => {
        data.set(key, value);
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const value: unknown = data.get(key);
        return value === undefined ? null : JSON.parse(JSON.stringify(value));
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

export function runAction({
  action,
  props,
}: {
  action: { run: unknown };
  props: Record<string, unknown>;
}): Promise<unknown> {
  return Promise.resolve(
    Reflect.apply(asFunction(action.run), action, [
      {
        auth: AUTH,
        propsValue: { auth: AUTH, ...props },
        store: memoryStore().store,
      },
    ])
  );
}

export function runHook({
  trigger,
  hook,
  context,
}: {
  trigger: Record<string, unknown>;
  hook: 'run' | 'onEnable' | 'onDisable' | 'test';
  context: Record<string, unknown>;
}): Promise<unknown> {
  return Promise.resolve(
    Reflect.apply(asFunction(trigger[hook]), trigger, [
      { auth: AUTH, propsValue: {}, ...context },
    ])
  );
}

export function asFunction(value: unknown): (...args: unknown[]) => unknown {
  if (typeof value !== 'function') {
    throw new Error('not a function');
  }
  return (...args: unknown[]) => Reflect.apply(value, undefined, args);
}

export function listBody({
  items,
  total = items.length,
  page = 1,
}: {
  items: Record<string, unknown>[];
  total?: number;
  page?: number;
}) {
  return {
    response: { total, total_result: total, page, count: items.length, items },
  };
}

class FakeHttpError extends Error {
  readonly response: { status: number; body: unknown };
  constructor({ status, body }: { status: number; body: unknown }) {
    super(JSON.stringify({ response: { status, body } }));
    this.response = { status, body };
  }
}
