import {
  Property,
  Store,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName } from '../common';

export const pushToQueue = createAction({
  name: 'push-to-queue',
  description: 'Push item to queue',
  displayName: 'Push to Queue',
  props: {
    info: Property.MarkDown({
      value: `
      **Note:**
      - You can push items from other flows. The queue name should be unique across all flows.
      - The testing step work in isolation and doesn't affect the actual queue after publishing.
      `,
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
  return await store.put(key, updatedQueueItems, StoreScope.PROJECT)
}