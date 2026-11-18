import {
  Property,
  Store,
  createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName, queueNameProp, readQueue, sharedNotes, writeQueue } from '../common';
import { pushToQueueOutputSchema } from '../output-schemas';

const notes = `**Note:**
- Items are added to the end of the queue and returned oldest first by Pull items from queue.
${sharedNotes}
`
export const pushToQueue = createAction({
  audience: 'both',
  name: 'push-to-queue',
  classification: 'WRITE',
  description: 'Push item to queue',
  aiMetadata: { description: 'Appends one or more items to the end of a named project-scoped FIFO queue, creating the queue on first use; any flow using the same queue name writes to the same queue. Use it to buffer or throttle work for later consumption with Pull items from queue; use Get Queue Size or Peek at Queue to check the backlog without changing it. Not idempotent: each call appends the items again; the write fails once the queue would exceed 512 KB, and parallel runs pushing the same queue can lose items.', idempotent: false },
  displayName: 'Push to Queue',
  outputSchema: pushToQueueOutputSchema,
  props: {
    info: Property.MarkDown({
      value: notes,
    }),
    queueName: queueNameProp,
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
  const existingQueueItems = await readQueue({ store, key, queueName })
  if (items.length === 0) {
    return existingQueueItems
  }
  return writeQueue({ store, key, queueName, items: [...existingQueueItems, ...items] })
}
