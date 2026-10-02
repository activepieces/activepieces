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

  it('should split a snapshot that would exceed the store value limit', async () => {
    const arnAt = (index: number) => `arn:aws:lambda:us-east-1:123456789012:function:fn-${String(index).padStart(5, '0')}`;
    const itemBytes = Buffer.byteLength(JSON.stringify(arnAt(0)), 'utf8') + 1;
    const fitting = Math.floor((512 * 1024 - 2) / itemBytes);
    const arns = Array.from({ length: fitting + 1 }, (_, index) => arnAt(index));
    const functions = arns.map((FunctionArn) => ({ FunctionArn }));
    const store = memoryStore();

    const emitted = await remember(store, functions, true);

    expect(emitted).toEqual([]);
    const first = store.data[SEEN_FUNCTION_ARNS_KEY];
    const second = store.data[`${SEEN_FUNCTION_ARNS_KEY}-1`];
    expect(Buffer.byteLength(JSON.stringify(first), 'utf8')).toBeLessThanOrEqual(512 * 1024);
    expect(Buffer.byteLength(JSON.stringify(second), 'utf8')).toBeLessThanOrEqual(512 * 1024);
    expect([...(first as string[]), ...(second as string[])]).toEqual(arns);

    const created = { FunctionArn: arnAt(arns.length) };
    const next = await remember(store, [...functions, created], false);

    expect(next).toEqual([created]);

    await newFunctionCreated.onDisable({ store } as never);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toBeUndefined();
    expect(store.data[`${SEEN_FUNCTION_ARNS_KEY}-1`]).toBeUndefined();
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
    expect(store.data[`${SEEN_FUNCTION_ARNS_KEY}-1`]).toBeUndefined();
  });

  it('should return a sample of current functions from test without changing the snapshot', async () => {
    listFunctions.mockResolvedValue([billing, invoices]);
    const store = memoryStore({ [SEEN_FUNCTION_ARNS_KEY]: [] });

    const sample = await newFunctionCreated.test({ auth, store, server, propsValue: {} } as never);

    expect(sample).toEqual([billing, invoices]);
    expect(store.data[SEEN_FUNCTION_ARNS_KEY]).toEqual([]);
  });
});
