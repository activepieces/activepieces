import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Action,
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  createMockActionContext,
  InputPropertyMap,
  PieceAuthProperty,
  StaticPropsValue,
  Store,
  StoreScope,
} from '@activepieces/pieces-framework';
import { queue } from '../src';
import { clearQueue } from '../src/lib/actions/clear-queue';
import { getQueueSize } from '../src/lib/actions/get-queue-size';
import { peekQueue } from '../src/lib/actions/peek-queue';
import { pullFromQueue } from '../src/lib/actions/pull-from-queue';
import { pushToQueue } from '../src/lib/actions/push-to-queue';
import { constructQueueName, MAX_QUEUE_NAME_LENGTH, MAX_TEST_QUEUE_NAME_LENGTH } from '../src/lib/common';

const REAL_KEY = (name: string) => `_queue_rmAPlFmX0s_${name}`;
const TEST_KEY = (name: string) => `_queue_rmAPlFmX0s_testing_${name}`;

function createFakeStore() {
  const data = new Map<string, unknown>();
  const store: Store = {
    put: async (key, value) => {
      data.set(key, value);
      return value;
    },
    get: async (key) => (data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null),
    delete: async (key) => {
      data.delete(key);
    },
  };
  const spies = {
    put: vi.spyOn(store, 'put'),
    get: vi.spyOn(store, 'get'),
    delete: vi.spyOn(store, 'delete'),
  };
  return { data, store, spies };
}

const NO_AUTH: AppConnectionValueForAuthProperty<PieceAuthProperty> = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: '',
};

function runAction<Props extends InputPropertyMap>({
  action,
  store,
  propsValue,
  mode = 'run',
}: {
  action: Action<PieceAuthProperty, Props>;
  store: Store;
  propsValue: StaticPropsValue<Props>;
  mode?: 'run' | 'test';
}): Promise<unknown> {
  const context = { ...createMockActionContext<Props>({ propsValue }), auth: NO_AUTH, store };
  const fn = mode === 'test' ? action.test : action.run;
  return fn(context);
}

let fake: ReturnType<typeof createFakeStore>;
beforeEach(() => {
  fake = createFakeStore();
});

describe('piece registration', () => {
  it('registers all five actions', () => {
    expect(Object.keys(queue.actions()).sort()).toEqual(
      ['clear-queue', 'get-queue-size', 'peek-queue', 'pull-from-queue', 'push-to-queue'],
    );
  });

  it('new actions are read-only, idempotent and visible to both audiences', () => {
    for (const action of [peekQueue, getQueueSize]) {
      expect(action.classification).toBe('READ');
      expect(action.aiMetadata?.idempotent).toBe(true);
      expect(action.audience).toBe('both');
      expect(action.outputSchema).toBeDefined();
    }
  });
});

describe('queue key', () => {
  it('keeps the exact storage key for real and testing queues', () => {
    expect(constructQueueName('orders', false)).toBe('_queue_rmAPlFmX0s_orders');
    expect(constructQueueName('orders', true)).toBe('_queue_rmAPlFmX0s_testing_orders');
  });

  it('does not trim or change the case of a name', () => {
    expect(constructQueueName(' My Queue ', false)).toBe('_queue_rmAPlFmX0s_ My Queue ');
  });

  it('accepts the longest names that fit in a 128-character key', () => {
    expect(MAX_QUEUE_NAME_LENGTH).toBe(110);
    expect(MAX_TEST_QUEUE_NAME_LENGTH).toBe(102);
    expect(constructQueueName('a'.repeat(110), false)).toHaveLength(128);
    expect(constructQueueName('a'.repeat(102), true)).toHaveLength(128);
  });

  it('rejects names that are too long with a readable message', () => {
    expect(() => constructQueueName('a'.repeat(111), false)).toThrow(
      'Queue name is too long (111 characters). Use at most 110 characters.',
    );
    expect(() => constructQueueName('a'.repeat(103), true)).toThrow(
      'Use at most 102 characters when testing a single step (110 in flow runs).',
    );
  });

  it('rejects empty and blank names', () => {
    expect(() => constructQueueName('', false)).toThrow('Queue name is empty');
    expect(() => constructQueueName('   ', true)).toThrow('Queue name is empty');
  });

  it('uses the testing key in test() and the real key in run()', async () => {
    await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: ['real'] }, mode: 'run' });
    await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: ['test'] }, mode: 'test' });
    expect(fake.data.get(REAL_KEY('q'))).toEqual(['real']);
    expect(fake.data.get(TEST_KEY('q'))).toEqual(['test']);
    expect(fake.spies.put).toHaveBeenCalledWith(REAL_KEY('q'), ['real'], StoreScope.PROJECT);
  });
});

describe('push-to-queue', () => {
  it('returns the whole queue after the append (unchanged output shape)', async () => {
    expect(await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: ['a'] } })).toEqual(['a']);
    expect(await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: ['b', { id: 1 }, 3] } })).toEqual(['a', 'b', { id: 1 }, 3]);
  });

  it('does not write when there are no items and returns the existing queue', async () => {
    fake.data.set(REAL_KEY('q'), ['a']);
    expect(await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: [] } })).toEqual(['a']);
    expect(await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'new', items: [] } })).toEqual([]);
    expect(fake.spies.put).not.toHaveBeenCalled();
    expect(fake.data.has(REAL_KEY('new'))).toBe(false);
  });

  it('maps a storage limit error to a plain sentence', async () => {
    fake.spies.put.mockRejectedValueOnce(Object.assign(new Error('{"message":"too big"}'), { name: 'StorageLimitError', maxStorageSizeInBytes: 512 * 1024 }));
    await expect(runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: ['x'] } })).rejects.toThrow(
      'Queue "q" would exceed the 512 KB size limit, so nothing was written. Pull items from the queue more often or push smaller items.',
    );
  });

  it('rethrows other store errors unchanged', async () => {
    const boom = Object.assign(new Error('store down'), { name: 'StorageError' });
    fake.spies.put.mockRejectedValueOnce(boom);
    await expect(runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: ['x'] } })).rejects.toBe(boom);
  });

  it('refuses a stored value that is not a list', async () => {
    fake.data.set(REAL_KEY('q'), 'abc');
    await expect(runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', items: ['x'] } })).rejects.toThrow(
      'Queue "q" holds a value that is not a list',
    );
    expect(fake.spies.put).not.toHaveBeenCalled();
  });
});

describe('pull-from-queue', () => {
  it('pulls in FIFO order and writes the remainder back', async () => {
    fake.data.set(REAL_KEY('q'), ['a', 'b', 'c', 'd']);
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 2 } })).toEqual(['a', 'b']);
    expect(fake.data.get(REAL_KEY('q'))).toEqual(['c', 'd']);
  });

  it('returns what is left when fewer items than requested are queued', async () => {
    fake.data.set(REAL_KEY('q'), ['a', 'b']);
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 50 } })).toEqual(['a', 'b']);
    expect(fake.data.get(REAL_KEY('q'))).toEqual([]);
  });

  it('returns [] on an empty or never-created queue without writing', async () => {
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'none', numOfItems: 3 } })).toEqual([]);
    fake.data.set(REAL_KEY('empty'), []);
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'empty', numOfItems: 3 } })).toEqual([]);
    expect(fake.spies.put).not.toHaveBeenCalled();
    expect(fake.data.has(REAL_KEY('none'))).toBe(false);
  });

  it('accepts 0 and returns [] without writing', async () => {
    fake.data.set(REAL_KEY('q'), ['a']);
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 0 } })).toEqual([]);
    expect(fake.spies.put).not.toHaveBeenCalled();
    expect(fake.data.get(REAL_KEY('q'))).toEqual(['a']);
  });

  it.each([-1, 2.5, Number.POSITIVE_INFINITY, Number.NaN])('rejects %s before touching the store', async (numOfItems) => {
    fake.data.set(REAL_KEY('q'), ['a']);
    await expect(runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems } })).rejects.toThrow(
      'Number of items must be a whole number of 0 or more',
    );
    expect(fake.spies.get).not.toHaveBeenCalled();
    expect(fake.spies.put).not.toHaveBeenCalled();
  });

  it('refuses a stored value that is not a list', async () => {
    fake.data.set(REAL_KEY('q'), { a: 1 });
    await expect(runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 1 } })).rejects.toThrow('is not a list');
  });

  it('pulls from the testing queue in test()', async () => {
    fake.data.set(REAL_KEY('q'), ['real']);
    fake.data.set(TEST_KEY('q'), ['test']);
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 5 }, mode: 'test' })).toEqual(['test']);
    expect(fake.data.get(REAL_KEY('q'))).toEqual(['real']);
  });
});

describe('peek-queue', () => {
  it('returns the first items and the total without changing the queue', async () => {
    fake.data.set(REAL_KEY('q'), ['a', 'b', 'c']);
    const expected = { items: ['a', 'b'], itemCount: 2, queueSize: 3 };
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 2 } })).toEqual(expected);
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 2 } })).toEqual(expected);
    expect(fake.spies.put).not.toHaveBeenCalled();
    expect(fake.spies.delete).not.toHaveBeenCalled();
    expect(fake.data.get(REAL_KEY('q'))).toEqual(['a', 'b', 'c']);
  });

  it('defaults to one item when the count is left empty', async () => {
    fake.data.set(REAL_KEY('q'), ['a', 'b']);
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: undefined } })).toEqual({ items: ['a'], itemCount: 1, queueSize: 2 });
  });

  it('handles an empty queue, a count of 0 and a count larger than the queue', async () => {
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'none', numOfItems: 3 } })).toEqual({ items: [], itemCount: 0, queueSize: 0 });
    fake.data.set(REAL_KEY('q'), ['a', 'b']);
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 0 } })).toEqual({ items: [], itemCount: 0, queueSize: 2 });
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 10 } })).toEqual({ items: ['a', 'b'], itemCount: 2, queueSize: 2 });
  });

  it.each([-1, 1.5, Number.POSITIVE_INFINITY])('rejects %s before touching the store', async (numOfItems) => {
    await expect(runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems } })).rejects.toThrow('whole number');
    expect(fake.spies.get).not.toHaveBeenCalled();
  });

  it('reads the testing queue in test()', async () => {
    fake.data.set(REAL_KEY('q'), ['real']);
    fake.data.set(TEST_KEY('q'), ['test', 'test2']);
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q', numOfItems: 5 }, mode: 'test' })).toEqual({ items: ['test', 'test2'], itemCount: 2, queueSize: 2 });
  });
});

describe('get-queue-size', () => {
  it('counts the items without changing the queue', async () => {
    fake.data.set(REAL_KEY('q'), ['a', 'b', 'c']);
    expect(await runAction({ action: getQueueSize, store: fake.store, propsValue: { info: undefined, queueName: 'q' } })).toEqual({ queueName: 'q', size: 3, isEmpty: false });
    expect(fake.spies.put).not.toHaveBeenCalled();
  });

  it('reports a never-created queue as empty', async () => {
    expect(await runAction({ action: getQueueSize, store: fake.store, propsValue: { info: undefined, queueName: 'none' } })).toEqual({ queueName: 'none', size: 0, isEmpty: true });
  });

  it('counts the testing queue in test()', async () => {
    fake.data.set(REAL_KEY('q'), ['real']);
    expect(await runAction({ action: getQueueSize, store: fake.store, propsValue: { info: undefined, queueName: 'q' }, mode: 'test' })).toEqual({ queueName: 'q', size: 0, isEmpty: true });
  });
});

describe('clear-queue', () => {
  it('deletes the queue and is idempotent', async () => {
    fake.data.set(REAL_KEY('q'), ['a']);
    expect(await runAction({ action: clearQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q' } })).toEqual({ success: true });
    expect(await runAction({ action: clearQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q' } })).toEqual({ success: true });
    expect(fake.data.has(REAL_KEY('q'))).toBe(false);
    expect(fake.spies.delete).toHaveBeenCalledWith(REAL_KEY('q'), StoreScope.PROJECT);
  });

  it('clears only the testing queue in test()', async () => {
    fake.data.set(REAL_KEY('q'), ['real']);
    fake.data.set(TEST_KEY('q'), ['test']);
    await runAction({ action: clearQueue, store: fake.store, propsValue: { info: undefined, queueName: 'q' }, mode: 'test' });
    expect(fake.data.get(REAL_KEY('q'))).toEqual(['real']);
    expect(fake.data.has(TEST_KEY('q'))).toBe(false);
  });
});

describe('full FIFO round trip', () => {
  it('push, peek, size, pull, clear', async () => {
    await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'flow', items: ['a'] } });
    await runAction({ action: pushToQueue, store: fake.store, propsValue: { info: undefined, queueName: 'flow', items: ['b', 'c'] } });
    expect(await runAction({ action: getQueueSize, store: fake.store, propsValue: { info: undefined, queueName: 'flow' } })).toEqual({ queueName: 'flow', size: 3, isEmpty: false });
    expect(await runAction({ action: peekQueue, store: fake.store, propsValue: { info: undefined, queueName: 'flow', numOfItems: 1 } })).toEqual({ items: ['a'], itemCount: 1, queueSize: 3 });
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'flow', numOfItems: 2 } })).toEqual(['a', 'b']);
    expect(await runAction({ action: pullFromQueue, store: fake.store, propsValue: { info: undefined, queueName: 'flow', numOfItems: 2 } })).toEqual(['c']);
    expect(await runAction({ action: getQueueSize, store: fake.store, propsValue: { info: undefined, queueName: 'flow' } })).toEqual({ queueName: 'flow', size: 0, isEmpty: true });
    expect(await runAction({ action: clearQueue, store: fake.store, propsValue: { info: undefined, queueName: 'flow' } })).toEqual({ success: true });
  });
});
