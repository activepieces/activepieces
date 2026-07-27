import {
  Property,
  Store,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName, formatStorageError } from '../common';

const notes = `**Note:**
- You can push items from other flows. The queue name should be unique across all flows.
- The testing step work in isolation and doesn't affect the actual queue after publishing.
`
export const pushToQueue = createAction({
  audience: 'both',
  name: 'push-to-queue',
  description: 'Push item to queue',
  aiMetadata: { description: 'Appends one or more items to the end of a named project-scoped FIFO queue, creating the queue on first use; the queue name is a plain string shared across the whole project, so any flow using the same name writes to the same queue. Use it to buffer or throttle work for later consumption, then read it back with Pull items from queue, or discard everything with Clear queue. Not idempotent: each call appends the items again, and the write fails once the accumulated queue exceeds the project store size limit.', idempotent: false },
  displayName: 'Push to Queue',
  props: {
    info: Property.MarkDown({
      value: notes,
    }),
    queueName: Property.ShortText({
      displayName: 'Queue Name',
      required: true,
    }),
    items: Property.Array({
      displayName: 'Items',
      required: true,
    }),
  },
  async run(context) {
    return push({ store: context.store, queueName: context.propsValue.queueName, items: context.propsValue.items, testing: false })
  },
  async test(context) {
    return push({ store: context.store, queueName: context.propsValue.queueName, items: context.propsValue.items, testing: true })
  }
});

async function push({ store, queueName, items, testing }: { store: Store, queueName: string, items: unknown[], testing: boolean }) {
  const key = constructQueueName(queueName, testing)
  const existingQueueItems = await store.get<unknown[]>(key, StoreScope.PROJECT) || []
  const updatedQueueItems = [...existingQueueItems, ...items]
  try {
    return await store.put(key, updatedQueueItems, StoreScope.PROJECT)
  } catch (e: unknown) {
    const name = (e as Error)?.name;
    if (name === 'StorageLimitError') {
      throw formatStorageError(e)
    } else {
      throw e
    }
  }
}