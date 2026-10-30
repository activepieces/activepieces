import {
  ActionContext,
  AppConnectionType,
  InputPropertyMap,
  PropertyContext,
  StaticPropsValue,
  Store,
  TestOrRunHookContext,
  TriggerHookContext,
  TriggerStrategy,
  createMockActionContext,
  createMockPollingTriggerContext,
} from '@activepieces/pieces-framework';
import { Readable } from 'node:stream';
import { vi } from 'vitest';
import { zohoCrmAuth } from '../src/lib/auth';
import type { ZohoAuth } from '../src/lib/common/client';

export const sendRequest = vi.fn();

export function mockHttpClient() {
  return {
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
}

export function ok({ body, status = 200, headers = {} }: { body: unknown; status?: number; headers?: Record<string, unknown> }) {
  sendRequest.mockResolvedValueOnce({ status, headers, body });
}

export function captureWrites(): { files: ActionContext['files']; calls: { fileName: string; streamed: boolean; content: string }[] } {
  const calls: { fileName: string; streamed: boolean; content: string }[] = [];
  const write = async ({ fileName, data }: { fileName: string; data: Buffer | Readable }): Promise<string> => {
    const streamed = !Buffer.isBuffer(data);
    const chunks: Buffer[] = [];
    if (Buffer.isBuffer(data)) {
      chunks.push(data);
    } else {
      for await (const chunk of data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
    }
    calls.push({ fileName, streamed, content: Buffer.concat(chunks).toString() });
    return 'file://stored';
  };
  return { files: { write, upload: async () => ({ id: 'f', url: 'file://stored' }) }, calls };
}

export function httpError({ status, body }: { status: number; body: unknown }): Error {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status, body } });
}

export function call(index: number) {
  return sendRequest.mock.calls[index][0];
}

export function memoryStore(): { store: Store; read: (key: string) => unknown } {
  const map = new Map<string, string>();
  const store: Store = {
    put: async (key, value) => {
      map.set(key, JSON.stringify(value));
      return value;
    },
    get: async (key) => {
      const raw = map.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key) => {
      map.delete(key);
    },
  };
  return {
    store,
    read: (key) => {
      const raw = map.get(key);
      return raw === undefined ? undefined : JSON.parse(raw);
    },
  };
}

export function runAction<Props extends InputPropertyMap>({
  action,
  propsValue,
  files,
  auth = AUTH,
}: {
  action: { props: Props; run: (context: ActionContext<typeof zohoCrmAuth, Props>) => Promise<unknown> };
  propsValue: StaticPropsValue<Props>;
  files?: ActionContext['files'];
  auth?: ZohoAuth;
}): Promise<unknown> {
  const base = createMockActionContext<Props>({ propsValue });
  return action.run({ ...base, auth, files: files ?? base.files });
}

export function asPolling<T extends { type: TriggerStrategy }>(trigger: T): Extract<T, { type: TriggerStrategy.POLLING }> {
  if (!isPolling(trigger)) {
    throw new Error('not a polling trigger');
  }
  return trigger;
}

export function runTrigger<Props extends InputPropertyMap>({
  trigger,
  propsValue,
  store,
}: {
  trigger: PollingTriggerLike<Props>;
  propsValue: StaticPropsValue<Props>;
  store: Store;
}): Promise<unknown[]> {
  return trigger.run(triggerContext({ propsValue, store }));
}

export function enableTrigger<Props extends InputPropertyMap>({
  trigger,
  propsValue,
  store,
  isRepublish,
}: {
  trigger: PollingTriggerLike<Props>;
  propsValue: StaticPropsValue<Props>;
  store: Store;
  isRepublish?: boolean;
}): Promise<void> {
  return trigger.onEnable(triggerContext({ propsValue, store, isRepublish }));
}

export function propertyContext(): PropertyContext {
  const base = createMockActionContext({ propsValue: {} });
  return { server: base.server, project: base.project, flows: base.flows, connections: base.connections };
}

function isPolling<T extends { type: TriggerStrategy }>(trigger: T): trigger is Extract<T, { type: TriggerStrategy.POLLING }> {
  return trigger.type === TriggerStrategy.POLLING;
}

function triggerContext<Props extends InputPropertyMap>({
  propsValue,
  store,
  isRepublish,
}: {
  propsValue: StaticPropsValue<Props>;
  store: Store;
  isRepublish?: boolean;
}): TestOrRunHookContext<typeof zohoCrmAuth, Props, TriggerStrategy.POLLING> {
  const base = createMockActionContext<Props>({ propsValue });
  return {
    ...createMockPollingTriggerContext<Props>({ propsValue }),
    auth: AUTH,
    store,
    files: base.files,
    isRepublish,
  };
}

type PollingTriggerLike<Props extends InputPropertyMap> = {
  props: Props;
  run: (context: TestOrRunHookContext<typeof zohoCrmAuth, Props, TriggerStrategy.POLLING>) => Promise<unknown[]>;
  onEnable: (context: TriggerHookContext<typeof zohoCrmAuth, Props, TriggerStrategy.POLLING>) => Promise<void>;
};

export const AUTH = {
  type: AppConnectionType.OAUTH2,
  access_token: 'tok-123',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://localhost/redirect',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: 'ZohoCRM.modules.ALL',
  token_url: 'https://accounts.zoho.com/oauth/v2/token',
  data: { api_domain: 'https://www.zohoapis.com' },
  props: { location: 'zoho.com' },
} satisfies ZohoAuth;

export const AUTH_EU: ZohoAuth = { ...AUTH, data: { api_domain: 'https://www.zohoapis.eu' }, props: { location: 'zoho.eu' } };
