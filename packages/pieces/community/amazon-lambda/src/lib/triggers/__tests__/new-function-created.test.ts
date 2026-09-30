import type { Store } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listFunctions } = vi.hoisted(() => ({
  listFunctions: vi.fn<(auth: unknown, server: unknown) => Promise<unknown>>(),
}));

vi.mock('../../common/client', () => ({ listFunctions }));

const { newFunctionCreated, remember, SEEN_FUNCTION_ARNS_KEY } = await import('../new-function-created');

function memoryStore(initial: Record<string, unknown> = {}): Store & { data: Record<string, unknown> } {
  const data = { ...initial };
  return {
    data,
    async get<T>(key: string) {
      return (key in data ? data[key] : null) as T | null;
    },
    async put<T>(key: string, value: T) {
      data[key] = value;
      return value;
    },
    async delete(key: string) {
      delete data[key];
    },
  };
}

const billing = {
  FunctionName: 'billing',
  FunctionArn: 'arn:aws:lambda:us-east-1:123:function:billing',
  Runtime: 'nodejs20.x',
  LastModified: '2026-09-28T12:00:00.000+0000',
};
const invoices = {
  FunctionName: 'invoices',
  FunctionArn: 'arn:aws:lambda:us-east-1:123:function:invoices',
  Runtime: 'nodejs20.x',
  LastModified: '2026-09-28T13:00:00.000+0000',
};

describe('remember', () => {
  it('should store the current ARNs and emit nothing when the trigger is enabled', async () => {
    const store = memoryStore();

    const emitted = await remember(store, [billing], true);

    expect(emitted).toEqual([]);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toEqual([billing.FunctionArn]);
  });

  it('should emit only ARNs that were not in the previous snapshot', async () => {
    const store = memoryStore({ [SEEN_FUNCTION_ARNS_KEY]: [billing.FunctionArn] });
    const updated = { ...billing, LastModified: '2026-09-28T18:00:00.000+0000' };

    const emitted = await remember(store, [updated, invoices], false);

    expect(emitted).toEqual([invoices]);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toEqual([billing.FunctionArn, invoices.FunctionArn]);
  });

  it('should stay quiet on the first poll when enabling never ran', async () => {
    const store = memoryStore();

    const emitted = await remember(store, [billing], false);

    expect(emitted).toEqual([]);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toEqual([billing.FunctionArn]);
  });
});

describe('newFunctionCreated', () => {
  const auth = { props: { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'us-east-1' } };
  const server = { apiUrl: 'http://localhost/api/', publicUrl: 'http://localhost', token: 'worker-token' };

  beforeEach(() => {
    listFunctions.mockReset();
  });

  it('should record existing functions on enable and delete them on disable', async () => {
    listFunctions.mockResolvedValue([billing]);
    const store = memoryStore();

    await newFunctionCreated.onEnable({ auth, store, server, propsValue: {} } as never);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toEqual([billing.FunctionArn]);

    await newFunctionCreated.onDisable({ auth, store, server, propsValue: {} } as never);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toBeUndefined();
  });

  it('should return a sample of current functions from test without changing the snapshot', async () => {
    listFunctions.mockResolvedValue([billing, invoices]);
    const store = memoryStore({ [SEEN_FUNCTION_ARNS_KEY]: [] });

    const sample = await newFunctionCreated.test({ auth, store, server, propsValue: {} } as never);

    expect(sample).toEqual([billing, invoices]);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toEqual([]);
  });
});
