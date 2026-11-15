import { AppConnectionType, createMockActionContext, Store } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export const BASE = 'https://pod01.withmoxie.com/api/public';
export const API_KEY = 'test-api-key';
export const AUTH = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { baseUrl: BASE, apiKey: API_KEY },
};
export const WEBHOOK_URL = 'https://ap.example.com/api/v1/webhooks/flow123';

export const sendRequest = vi.fn();

export function ok({ body, headers = {} }: { body: unknown; headers?: Record<string, string> }): void {
  sendRequest.mockResolvedValueOnce({ status: 200, headers, body });
}

export function fail({ status, body = {} }: { status: number; body?: unknown }): void {
  sendRequest.mockRejectedValueOnce(new FakeHttpError({ status, body }));
}

export function request(index: number): Record<string, unknown> {
  const call: unknown = sendRequest.mock.calls[index]?.[0];
  if (typeof call !== 'object' || call === null) {
    throw new Error(`no request #${index}`);
  }
  return Object.fromEntries(Object.entries(call));
}

export function lastRequest(): Record<string, unknown> {
  return request(sendRequest.mock.calls.length - 1);
}

export function memoryStore({ initial = {}, failPut = false }: { initial?: Record<string, unknown>; failPut?: boolean } = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  const store: Store = {
    put: async (key, value) => {
      if (failPut) {
        throw new Error('store unavailable');
      }
      data.set(key, value);
      return value;
    },
    get: async (key) => (data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null),
    delete: async (key) => {
      data.delete(key);
    },
  };
  const spies = {
    put: vi.spyOn(store, 'put'),
    get: vi.spyOn(store, 'get'),
    delete: vi.spyOn(store, 'delete'),
  };
  return { data, store, spies };
}

export function runAction({
  action,
  props,
  auth = AUTH,
}: {
  action: { run: unknown };
  props: Record<string, unknown>;
  auth?: unknown;
}): Promise<unknown> {
  const context = { ...createMockActionContext({ propsValue: props }), auth };
  return Promise.resolve(Reflect.apply(asFunction(action.run), action, [context]));
}

export function runHook({
  trigger,
  hook,
  context,
}: {
  trigger: object;
  hook: 'run' | 'onEnable' | 'onDisable';
  context: Record<string, unknown>;
}): Promise<unknown> {
  const fn: unknown = Reflect.get(trigger, hook);
  return Promise.resolve(
    Reflect.apply(asFunction(fn), trigger, [{ auth: AUTH, webhookUrl: WEBHOOK_URL, propsValue: {}, ...context }]),
  );
}

export function loadOptions({
  prop,
  values,
}: {
  prop: unknown;
  values: Record<string, unknown>;
}): Promise<unknown> {
  if (typeof prop !== 'object' || prop === null) {
    throw new Error('not a property');
  }
  const options: unknown = Reflect.get(prop, 'options');
  return Promise.resolve(Reflect.apply(asFunction(options), prop, [values, {}]));
}

function asFunction(value: unknown): (...args: unknown[]) => unknown {
  if (typeof value !== 'function') {
    throw new Error('not a function');
  }
  return (...args: unknown[]) => Reflect.apply(value, undefined, args);
}

class FakeHttpError extends Error {
  readonly response: { status: number; body: unknown };

  constructor({ status, body }: { status: number; body: unknown }) {
    super(JSON.stringify({ response: { status, body } }));
    this.response = { status, body };
  }
}
