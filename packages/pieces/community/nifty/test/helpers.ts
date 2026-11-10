import { AppConnectionType, InputPropertyMap, StaticPropsValue } from '@activepieces/pieces-framework';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';

export function testAuth() {
  return {
    type: AppConnectionType.OAUTH2 as const,
    access_token: 'tok_test',
    client_id: 'client',
    client_secret: 'secret',
    redirect_url: 'https://example.com/redirect',
    token_type: 'Bearer',
    claimed_at: 0,
    refresh_token: 'refresh',
    scope: 'task project',
    token_url: 'https://openapi.niftypm.com/oauth/token',
    data: {},
  };
}

export function runAction<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: { run: (context: never) => Promise<unknown> };
  propsValue: StaticPropsValue<Props> | Record<string, unknown>;
}): Promise<unknown> {
  const context = { ...createMockActionContext({ propsValue: {} }), propsValue, auth: testAuth() };
  return Reflect.apply(action.run, action, [context]);
}

export function triggerContext({
  propsValue,
  store,
  isRepublish = false,
}: {
  propsValue: Record<string, unknown>;
  store: Map<string, string>;
  isRepublish?: boolean;
}) {
  return {
    ...createMockPollingTriggerContext({ propsValue: {} }),
    propsValue,
    isRepublish,
    auth: testAuth(),
    store: {
      put: async <T>(key: string, value: T) => {
        store.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const raw = store.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  };
}

export function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

export function created(body: unknown) {
  return { status: 201, headers: {}, body };
}

export function httpError({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status, body } });
}

export function task(overrides: Record<string, unknown>) {
  return {
    id: 't1',
    nice_id: 'ANP-1',
    name: 'Task',
    created_at: '2026-10-05T10:00:00.000Z',
    completed: false,
    project: 'p1',
    task_group: 's1',
    ...overrides,
  };
}
