import {
  Property,
  StoreScope,
  createAction,
} from '@activepieces/pieces-framework';

export const pushToQueue = createAction({
  name: 'push-to-queue',
  description: 'Push item to queue',
  displayName: 'Push to Queue',
  props: {
    queueName: Property.ShortText({
      displayName: 'Queue Name',
      description: 'Name of the queue to push item to',
      required: true,
    }),
    items: Property.Array({
      displayName: 'Items',
      description: 'Items to push to queue',
      required: true,
    }),
  },
  async run(context) {
    const existingQueueItems = await context.store.get(context.propsValue.queueName, StoreScope.PROJECT) || []
    const updatedQueueItems = [...existingQueueItems as unknown[], ...context.propsValue.items]
    await context.store.put(context.propsValue.queueName, updatedQueueItems, StoreScope.PROJECT)
  },
});
