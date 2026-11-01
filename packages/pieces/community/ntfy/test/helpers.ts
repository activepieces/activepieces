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
  baseUrl,
}: {
  action: { run: (context: ActionContext<typeof ntfyAuth, Props>) => Promise<unknown> };
  propsValue: StaticPropsValue<Props>;
  token?: string;
  baseUrl?: string;
}) {
  return action.run({
    ...createMockActionContext<Props>({ propsValue }),
    auth: testAuth({ token, baseUrl }),
  });
}

export function triggerContext<Props extends InputPropertyMap>({
  propsValue,
  store,
}: {
  propsValue: StaticPropsValue<Props>;
  store: Map<string, string>;
}): TriggerHookContext<typeof ntfyAuth, Props, TriggerStrategy.POLLING> {
  return {
    ...createMockPollingTriggerContext<Props>({ propsValue }),
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

export function testAuth({ token, baseUrl = 'https://ntfy.example.com/' }: { token?: string; baseUrl?: string } = {}) {
  return {
    type: AppConnectionType.CUSTOM_AUTH as const,
    props: { base_url: baseUrl, access_token: token },
  };
}

export function ndjson(lines: Record<string, unknown>[]): string {
  return lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
}
