import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType, createMockActionContext, InputPropertyMap, Store } from '@activepieces/pieces-framework';

export const TEST_AUTH = { type: AppConnectionType.CUSTOM_AUTH, props: { accountId: ' acc_1 ', apiKey: ' key_1 ' } } as const;

export function runAction({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const run = action.run;
  if (typeof run !== 'function') {
    throw new Error('action has no run');
  }
  return Reflect.apply(run, action, [{ ...base, propsValue, auth: TEST_AUTH }]);
}

export function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError({}, { status, responseBody: body });
}

export function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

export function memoryStore({ failPut = false }: { failPut?: boolean } = {}): Store & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async put<T>(key: string, value: T): Promise<T> {
      if (failPut) {
        throw new Error('store down');
      }
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}
