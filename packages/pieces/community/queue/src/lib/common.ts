import { Property, Store, StoreScope } from '@activepieces/pieces-framework';

const QUEUE_KEY_PREFIX = '_queue_rmAPlFmX0s_';
const TESTING_KEY_PREFIX = 'testing_';
const STORE_KEY_MAX_LENGTH = 128;
const DEFAULT_MAX_STORAGE_SIZE_IN_BYTES = 512 * 1024;

export const MAX_QUEUE_NAME_LENGTH = STORE_KEY_MAX_LENGTH - QUEUE_KEY_PREFIX.length;
export const MAX_TEST_QUEUE_NAME_LENGTH = MAX_QUEUE_NAME_LENGTH - TESTING_KEY_PREFIX.length;

export function constructQueueName(queueName: string, testing: boolean) {
  if (typeof queueName !== 'string' || queueName.trim().length === 0) {
    throw new Error('Queue name is empty. Enter the name of the queue to use.');
  }
  const maxLength = testing ? MAX_TEST_QUEUE_NAME_LENGTH : MAX_QUEUE_NAME_LENGTH;
  if (queueName.length > maxLength) {
    const limit = testing
      ? `${MAX_TEST_QUEUE_NAME_LENGTH} characters when testing a single step (${MAX_QUEUE_NAME_LENGTH} in flow runs)`
      : `${MAX_QUEUE_NAME_LENGTH} characters`;
    throw new Error(`Queue name is too long (${queueName.length} characters). Use at most ${limit}.`);
  }
  return `${QUEUE_KEY_PREFIX}${testing ? TESTING_KEY_PREFIX : ''}${queueName}`;
}

export function validateItemCount({ value, fieldName }: { value: unknown; fieldName: string }): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a whole number of 0 or more, got ${String(value)}.`);
  }
  return value;
}

export async function readQueue({ store, key, queueName }: { store: Store; key: string; queueName: string }): Promise<unknown[]> {
  const value = await store.get<unknown>(key, StoreScope.PROJECT);
  if (value === null || value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`Queue "${queueName}" holds a value that is not a list, so it can't be used as a queue. Clear the queue, then push items again.`);
  }
  return value;
}

export async function writeQueue({ store, key, queueName, items }: { store: Store; key: string; queueName: string; items: unknown[] }): Promise<unknown[]> {
  try {
    return await store.put(key, items, StoreScope.PROJECT);
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'name' in e && e.name === 'StorageLimitError') {
      throw formatStorageError({ error: e, queueName });
    }
    throw e;
  }
}

export function formatStorageError({ error, queueName }: { error: object; queueName: string }) {
  const size = 'maxStorageSizeInBytes' in error ? error.maxStorageSizeInBytes : undefined;
  const maxSizeInBytes = typeof size === 'number' && size > 0 ? size : DEFAULT_MAX_STORAGE_SIZE_IN_BYTES;
  return new Error(
    `Queue "${queueName}" would exceed the ${Math.floor(maxSizeInBytes / 1024)} KB size limit, so nothing was written. Pull items from the queue more often or push smaller items.`,
  );
}

export const queueNameProp = Property.ShortText({
  displayName: 'Queue Name',
  description: `The name of the queue. Every flow in the project that uses the same name shares the same queue. Up to ${MAX_QUEUE_NAME_LENGTH} characters in flow runs, or ${MAX_TEST_QUEUE_NAME_LENGTH} when testing this step on its own.`,
  required: true,
});

export const sharedNotes = `- Queues are shared across the project: any flow using the same queue name reads and writes the same queue. A queue holds up to 512 KB of items.
- Testing this single step uses a separate test queue. Test Flow and published runs use the real queue.
- Use one flow run at a time per queue: runs that push or pull the same queue at the same moment can lose items or receive the same item twice.`;
