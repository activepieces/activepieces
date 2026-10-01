import { HttpError, httpClient } from '@activepieces/pieces-common';
import {
  ActionContext,
  AppConnectionType,
  ExecutionType,
  InputPropertyMap,
  StaticPropsValue,
  Store,
  StoreScope,
  TriggerStrategy,
  TestOrRunHookContext,
  PropertyContext,
} from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { sentAuth } from '../src/lib/auth';

export class MemoryStore implements Store {
  readonly entries = new Map<string, unknown>();
  async put<T>(key: string, value: T, scope?: StoreScope): Promise<T> {
    this.entries.set(`${scope}:${key}`, structuredClone(value));
    return value;
  }
  async get<T>(key: string, scope?: StoreScope): Promise<T | null> {
    const value = this.entries.get(`${scope}:${key}`);
    return value === undefined ? null : JSON.parse(JSON.stringify(value));
  }
  async delete(key: string, scope?: StoreScope): Promise<void> {
    this.entries.delete(`${scope}:${key}`);
  }
}

export function actionContext<Props extends InputPropertyMap>(
  propsValue: StaticPropsValue<Props>
): ActionContext<typeof sentAuth, Props> {
  return {
    ...baseContext(),
    propsValue,
    executionType: ExecutionType.BEGIN,
    run: {
      id: 'test-run',
      canPause: true,
      stop: vi.fn(),
      respond: vi.fn(),
      createWaitpoint: vi.fn(),
      waitForWaitpoint: vi.fn(),
    },
    tags: { add: vi.fn() },
    output: { update: vi.fn() },
  };
}

export function triggerContext<Props extends InputPropertyMap>(
  propsValue: StaticPropsValue<Props>
): TestOrRunHookContext<typeof sentAuth, Props, TriggerStrategy.WEBHOOK> {
  return {
    ...baseContext(),
    propsValue,
    webhookUrl: 'https://activepieces.example/api/v1/webhooks/test-flow',
    payload: { body: {}, headers: {}, queryParams: {} },
  };
}

function baseContext() {
  const auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = {
    type: AppConnectionType.SECRET_TEXT,
    secret_text: API_KEY,
  };
  return {
    auth,
    store: new MemoryStore(),
    flows: {
      list: vi.fn(),
      current: { id: 'test-flow', version: { id: 'test-version' } },
    },
    step: { name: 'test-step' },
    project: { id: 'test-project', externalId: vi.fn() },
    connections: { get: vi.fn() },
    server: {
      apiUrl: 'https://activepieces.example/api/',
      publicUrl: 'https://activepieces.example/',
      token: 'test-token',
    },
    files: { write: vi.fn(), upload: vi.fn() },
  };
}

export function respond({
  data,
  status = 200,
}: {
  data: unknown;
  status?: number;
}) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
    status,
    headers: {},
    body: {
      success: true,
      data,
      meta: {
        request_id: 'req_test',
        timestamp: '2026-01-15T10:30:00Z',
        version: 'v3',
      },
    },
  });
}

export function failure({
  status,
  code = 'TEST_ERROR',
  message = 'Test error',
}: {
  status: number;
  code?: string;
  message?: string;
}) {
  return new HttpError(undefined, {
    status,
    responseBody: {
      success: false,
      error: { code, message },
      meta: { request_id: 'req_test' },
    },
  });
}

export const API_KEY = 'test-only-key-with-no-prefix-validation';
export const SIGNING_SECRET =
  'whsec_AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=';
export const propertyContext: PropertyContext = baseContext();
export const authServer = {
  apiUrl: 'https://activepieces.example/api/',
  publicUrl: 'https://activepieces.example/',
  mintOidcToken: vi.fn(),
};
