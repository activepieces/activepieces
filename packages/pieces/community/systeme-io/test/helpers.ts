import crypto from 'crypto';
import { vi } from 'vitest';

export const API_KEY = 'systeme_test_key';
export const AUTH = { type: 'SECRET_TEXT', secret_text: API_KEY };
export const BASE = 'https://api.systeme.io/api';

export const sendRequest = vi.fn();

export function ok({ body, status = 200 }: { body: unknown; status?: number }) {
  sendRequest.mockResolvedValueOnce({ status, headers: {}, body });
}

export function fail({ status, body = {} }: { status: number; body?: unknown }) {
  sendRequest.mockRejectedValueOnce(new FakeHttpError({ status, body }));
}

export function request(index: number) {
  return sendRequest.mock.calls[index][0];
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

export function sign({ secret, body }: { secret: string; body: string }) {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

export function runAction({ action, props }: { action: { run: unknown }; props: Record<string, unknown> }): Promise<unknown> {
  return Promise.resolve(Reflect.apply(asFunction(action.run), action, [{ auth: AUTH, propsValue: props, store: memoryStore().store }]));
}

export function runHook({
  trigger,
  hook,
  context,
}: {
  trigger: Record<string, unknown>;
  hook: 'run' | 'onEnable' | 'onDisable';
  context: Record<string, unknown>;
}): Promise<unknown> {
  return Promise.resolve(Reflect.apply(asFunction(trigger[hook]), trigger, [{ auth: AUTH, webhookUrl: 'https://ap.example.com/v1/webhooks/abc', propsValue: {}, ...context }]));
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
