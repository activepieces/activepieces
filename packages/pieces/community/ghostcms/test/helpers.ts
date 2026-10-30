/// <reference types="vitest/globals" />

import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import {
  ActionContext,
  AppConnectionType,
  InputPropertyMap,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { ghostAuth } from '../src/lib/auth';

export function mockGhost({ replies }: { replies: Reply[] }): HttpRequest[] {
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

export function memoryStore({ initial }: { initial?: Record<string, unknown> } = {}) {
  const data = new Map<string, unknown>(Object.entries(initial ?? {}));
  return {
    data,
    put: async (key: string, value: unknown): Promise<unknown> => {
      data.set(key, value);
      return value;
    },
    get: async (key: string): Promise<unknown> => data.get(key) ?? null,
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

export function runAction<Props extends InputPropertyMap>({ action, propsValue }: RunActionParams<Props>) {
  const context: ActionContext<GhostAuth, Props> = {
    ...createMockActionContext<Props>({ propsValue }),
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: FIXTURE_AUTH.props },
  };
  return action.run(context);
}

export const FIXTURE_KEY_ID = '6aba8a1beab048bef80c3b7e';
export const FIXTURE_KEY_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
export const FIXTURE_AUTH = {
  props: { baseUrl: 'https://blog.example.com/', apiKey: `${FIXTURE_KEY_ID}:${FIXTURE_KEY_SECRET}` },
};
export const ADMIN_URL = 'https://blog.example.com/ghost/api/admin';

type GhostAuth = typeof ghostAuth;

type Reply = { status?: number; body: unknown } | { error: { status: number; body: unknown } };

type RunActionParams<Props extends InputPropertyMap> = {
  action: {
    props: Props;
    run: (context: ActionContext<GhostAuth, Props>) => Promise<unknown>;
  };
  propsValue: StaticPropsValue<Props>;
};
