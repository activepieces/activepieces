import {
  ActionContext,
  AppConnectionType,
  InputPropertyMap,
  StaticPropsValue,
  TriggerHookContext,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { ntfyAuth } from '../src/lib/auth';

export function runAction<Props extends InputPropertyMap>({
  action,
  propsValue,
  token,
}: {
  action: { run: (context: ActionContext<typeof ntfyAuth, Props>) => Promise<unknown> };
  propsValue: StaticPropsValue<Props>;
  token?: string;
}) {
  return action.run({
    ...createMockActionContext<Props>({ propsValue }),
    auth: testAuth(token),
  });
}

export function triggerContext<Props extends InputPropertyMap>({
  propsValue,
  store,
}: {
  propsValue: StaticPropsValue<Props>;
  store: Map<string, unknown>;
}): TriggerHookContext<typeof ntfyAuth, Props, TriggerStrategy.POLLING> {
  return {
    ...createMockPollingTriggerContext<Props>({ propsValue }),
    auth: testAuth(undefined),
    store: {
      put: async <T>(key: string, value: T) => {
        store.set(key, value);
        return value;
      },
      get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  };
}

export function testAuth(token: string | undefined) {
  return {
    type: AppConnectionType.CUSTOM_AUTH as const,
    props: { base_url: 'https://ntfy.example.com/', access_token: token },
  };
}

export function ndjson(lines: Record<string, unknown>[]): string {
  return lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
}
