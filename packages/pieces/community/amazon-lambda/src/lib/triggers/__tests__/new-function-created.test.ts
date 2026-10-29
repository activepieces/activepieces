import type { Store } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listFunctions } = vi.hoisted(() => ({
  listFunctions: vi.fn<(auth: unknown, server: unknown) => Promise<unknown>>(),
}));

vi.mock('../../common/client', () => ({ listFunctions }));

const {
  newFunctionCreated,
  remember,
  SEEN_FUNCTION_ARNS_KEY,
} = await import('../new-function-created');

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

    const emitted = await remember({ store, functions: [billing], initializeOnly: true });

    expect(emitted).toEqual([]);
    expect(savedArns(store)).toEqual([billing.FunctionArn]);
  });

  it('should emit a new ARN once and stay quiet on the next poll', async () => {
    const store = memoryStore();
    await remember({ store, functions: [billing], initializeOnly: true });
    const updated = { ...billing, LastModified: '2026-09-28T18:00:00.000+0000' };

    const emitted = await remember({ store, functions: [updated, invoices], initializeOnly: false });

    expect(emitted).toEqual([invoices]);
    expect(savedArns(store)).toEqual([billing.FunctionArn, invoices.FunctionArn]);

    const second = await remember({ store, functions: [updated, invoices], initializeOnly: false });

    expect(second).toEqual([]);
  });

  it('should forget a deleted ARN so a function recreated with that name fires again', async () => {
    const store = memoryStore();
    await remember({ store, functions: [billing, invoices], initializeOnly: true });

    expect(await remember({ store, functions: [billing], initializeOnly: false })).toEqual([]);
    expect(savedArns(store)).toEqual([billing.FunctionArn]);

    expect(await remember({ store, functions: [billing, invoices], initializeOnly: false })).toEqual([invoices]);
  });

  it('should split a snapshot that would exceed the store value limit and drop the replaced chunks', async () => {
    const arnAt = (index: number) => `arn:aws:lambda:us-east-1:123456789012:function:fn-${String(index).padStart(5, '0')}`;
    const itemBytes = Buffer.byteLength(JSON.stringify(arnAt(0)), 'utf8') + 1;
    const fitting = Math.floor((512 * 1024 - 2) / itemBytes);
    const arns = Array.from({ length: fitting + 1 }, (_, index) => arnAt(index));
    const functions = arns.map((FunctionArn) => ({ FunctionArn }));
    const store = memoryStore();

    const emitted = await remember({ store, functions, initializeOnly: true });

    expect(emitted).toEqual([]);
    const chunks = chunkValues(store);
    expect(chunks).toHaveLength(2);
    chunks.forEach((chunk) => expect(Buffer.byteLength(JSON.stringify(chunk), 'utf8')).toBeLessThanOrEqual(512 * 1024));
    expect(savedArns(store)).toEqual(arns);

    const created = { FunctionArn: arnAt(arns.length) };
    const next = await remember({ store, functions: [...functions, created], initializeOnly: false });

    expect(next).toEqual([created]);
    expect(chunkValues(store)).toHaveLength(2);
  });

  it('should keep the previous snapshot when a write fails so the next poll emits again', async () => {
    const store = memoryStore();
    await remember({ store, functions: [billing], initializeOnly: true });
    const put = store.put.bind(store);
    store.put = async <T>(key: string, value: T) => {
      if (key === SEEN_FUNCTION_ARNS_KEY) throw new Error('store unavailable');
      return put(key, value);
    };

    await expect(remember({ store, functions: [billing, invoices], initializeOnly: false })).rejects.toThrow('store unavailable');
    expect(savedArns(store)).toEqual([billing.FunctionArn]);

    store.put = put;
    expect(await remember({ store, functions: [billing, invoices], initializeOnly: false })).toEqual([invoices]);
  });

  it('should still emit when deleting the replaced chunks fails', async () => {
    const store = memoryStore();
    await remember({ store, functions: [billing], initializeOnly: true });
    store.delete = async () => {
      throw new Error('delete failed');
    };

    expect(await remember({ store, functions: [billing, invoices], initializeOnly: false })).toEqual([invoices]);
    expect(savedArns(store)).toEqual([billing.FunctionArn, invoices.FunctionArn]);
  });

  it('should stay quiet on the first poll when enabling never ran', async () => {
    const store = memoryStore();

    const emitted = await remember({ store, functions: [billing], initializeOnly: false });

    expect(emitted).toEqual([]);
    expect(savedArns(store)).toEqual([billing.FunctionArn]);
  });
});

describe('newFunctionCreated', () => {
  const auth = { props: { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'us-east-1' } };
  const server = { apiUrl: 'http://localhost/api/', publicUrl: 'http://localhost', token: 'worker-token' };

  beforeEach(() => {
    listFunctions.mockReset();
  });

  it('should record existing functions on enable and keep them through disable', async () => {
    listFunctions.mockResolvedValue([billing]);
    const store = memoryStore();

    await newFunctionCreated.onEnable({ auth, store, server, propsValue: {} } as never);
    expect(savedArns(store)).toEqual([billing.FunctionArn]);

    await newFunctionCreated.onDisable({ auth, store, server, propsValue: {} } as never);
    expect(savedArns(store)).toEqual([billing.FunctionArn]);
  });

  it('should keep the saved snapshot on republish so functions created since the last poll still fire', async () => {
    listFunctions.mockResolvedValue([billing]);
    const store = memoryStore();
    await newFunctionCreated.onEnable({ auth, store, server, propsValue: {} } as never);

    listFunctions.mockResolvedValue([billing, invoices]);
    await newFunctionCreated.onDisable({ auth, store, server, propsValue: {} } as never);
    await newFunctionCreated.onEnable({ auth, store, server, propsValue: {}, isRepublish: true } as never);

    expect(savedArns(store)).toEqual([billing.FunctionArn]);
    expect(await newFunctionCreated.run({ auth, store, server, propsValue: {} } as never)).toEqual([invoices]);
  });

  it('should take a fresh snapshot on a normal enable', async () => {
    listFunctions.mockResolvedValue([billing]);
    const store = memoryStore();
    await newFunctionCreated.onEnable({ auth, store, server, propsValue: {} } as never);

    listFunctions.mockResolvedValue([billing, invoices]);
    await newFunctionCreated.onEnable({ auth, store, server, propsValue: {} } as never);

    expect(savedArns(store)).toEqual([billing.FunctionArn, invoices.FunctionArn]);
  });

  it('should return a sample of current functions from test without changing the snapshot', async () => {
    listFunctions.mockResolvedValue([billing, invoices]);
    const store = memoryStore();

    const sample = await newFunctionCreated.test({ auth, store, server, propsValue: {} } as never);

    expect(sample).toEqual([billing, invoices]);
    expect(store.data).toEqual({});
  });
});

function savedArns(store: { data: Record<string, unknown> }): string[] {
  const pointer = store.data[SEEN_FUNCTION_ARNS_KEY] as { snapshotId: string; chunkCount: number };
  return Array.from({ length: pointer.chunkCount }, (_, index) => store.data[`${SEEN_FUNCTION_ARNS_KEY}:${pointer.snapshotId}:${index}`] as string[]).flat();
}

function chunkValues(store: { data: Record<string, unknown> }): unknown[] {
  return Object.entries(store.data)
    .filter(([key]) => key.startsWith(`${SEEN_FUNCTION_ARNS_KEY}:`))
    .map(([, value]) => value);
}
