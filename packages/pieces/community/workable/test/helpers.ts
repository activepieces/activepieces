/// <reference types="vitest/globals" />
import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { createMockActionContext } from '../../../framework/src/lib/test';

export const TOKEN = 'test-token-123';
export const SUB = 'acme';
export const BASE = 'https://acme.workable.com/spi/v3';
export const AUTH = { type: AppConnectionType.SECRET_TEXT, secret_text: TOKEN };

export type Reply = { status?: number; body: unknown } | { error: { status: number; body: unknown } };

export function mockHttp(replies: Reply[]): HttpRequest[] {
  const requests: HttpRequest[] = [];
  const queue = [...replies];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
    requests.push(request);
    const reply = queue.shift();
    if (!reply) {
      throw new Error(`unexpected request ${request.method} ${request.url}`);
    }
    if ('error' in reply) {
      throw Object.assign(new Error(`Request failed with status ${reply.error.status}`), {
        response: { status: reply.error.status, body: reply.error.body },
      });
    }
    return { status: reply.status ?? 200, headers: {}, body: reply.body };
  });
  return requests;
}

export const accountsReply: Reply = { body: { accounts: [{ id: '1', name: 'Acme', subdomain: SUB }] } };

export function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, value);
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => (data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null),
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

export function runAction(action: { run: (ctx: never) => Promise<unknown> }) {
  return (propsValue: Record<string, unknown>) =>
    Reflect.apply(action.run, action, [{ ...createMockActionContext({ propsValue }), auth: AUTH }]);
}

afterEach(() => {
  vi.restoreAllMocks();
});
