import {
  ActionContext,
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  InputPropertyMap,
  StaticPropsValue,
  Store,
  TestOrRunHookContext,
  TriggerHookContext,
  TriggerStrategy,
  createMockActionContext,
} from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import type { exaAuth } from '../src/lib/auth';

export const sendRequest = vi.fn();

export function mockHttpClient() {
  return {
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
}

export const AUTH: AppConnectionValueForAuthProperty<typeof exaAuth> = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'exa_test_key',
};

export function ok({ body, status = 200 }: { body: unknown; status?: number }) {
  sendRequest.mockResolvedValueOnce({ status, headers: {}, body });
}

export function fail({ status, body = { error: 'nope' } }: { status: number; body?: unknown }) {
  sendRequest.mockRejectedValueOnce(Object.assign(new Error(`status ${status}`), { response: { status, body } }));
}

export function lastRequest() {
  return sendRequest.mock.calls[sendRequest.mock.calls.length - 1][0];
}

export function runAction<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: { props: Props; run: (context: ActionContext<typeof exaAuth, Props>) => Promise<unknown> };
  propsValue: StaticPropsValue<Props>;
}): Promise<unknown> {
  const base = createMockActionContext<Props>({ propsValue });
  return action.run({ ...base, auth: AUTH });
}

export function memoryStore(initial: Record<string, unknown> = {}): {
  store: Store;
  data: Record<string, unknown>;
  failNextPut: (error: Error) => void;
} {
  const data: Record<string, unknown> = { ...initial };
  let nextPutError: Error | undefined;
  const store: Store = {
    put: async (key, value) => {
      if (nextPutError) {
        const error = nextPutError;
        nextPutError = undefined;
        throw error;
      }
      data[key] = value;
      return value;
    },
    get: async (key) => {
      const value = data[key];
      return value === undefined ? null : JSON.parse(JSON.stringify(value));
    },
    delete: async (key) => {
      delete data[key];
    },
  };
  return {
    store,
    data,
    failNextPut: (error) => {
      nextPutError = error;
    },
  };
}

export function asWebhook<T extends { type: TriggerStrategy }>(trigger: T): Extract<T, { type: TriggerStrategy.WEBHOOK }> {
  if (!isWebhook(trigger)) {
    throw new Error('not a webhook trigger');
  }
  return trigger;
}

export function webhookContext<Props extends InputPropertyMap>({
  propsValue,
  store,
  payload = { body: {}, headers: {}, queryParams: {} },
  webhookUrl = 'https://hooks.example.com/abc',
}: {
  propsValue: StaticPropsValue<Props>;
  store: Store;
  payload?: TestOrRunHookContext<typeof exaAuth, Props, TriggerStrategy.WEBHOOK>['payload'];
  webhookUrl?: string;
}): TestOrRunHookContext<typeof exaAuth, Props, TriggerStrategy.WEBHOOK> {
  const base = createMockActionContext<Props>({ propsValue });
  const context: TriggerHookContext<typeof exaAuth, Props, TriggerStrategy.WEBHOOK> = {
    auth: AUTH,
    propsValue,
    store,
    project: base.project,
    flows: base.flows,
    step: base.step,
    connections: base.connections,
    server: base.server,
    webhookUrl,
    payload,
  };
  return { ...context, files: base.files };
}

function isWebhook<T extends { type: TriggerStrategy }>(trigger: T): trigger is Extract<T, { type: TriggerStrategy.WEBHOOK }> {
  return trigger.type === TriggerStrategy.WEBHOOK;
}
