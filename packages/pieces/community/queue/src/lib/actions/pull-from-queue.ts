import {
    Property,
    Store,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName, formatStorageError } from '../common';

const notes = `**Note:**
- You can pull items from other flows. The queue name should be unique across all flows.
- The testing step work in isolation and doesn't affect the actual queue after publishing.
`
export const pullFromQueue = createAction({
  audience: 'both',
    name: 'pull-from-queue',
    description: 'Pull items from queue',
    aiMetadata: { description: 'Removes and returns the first N items of a named project-scoped FIFO queue and writes the remainder back, so it is a destructive consume rather than a peek - the returned items are gone from the queue, and fewer than requested come back when the queue holds less. Use it to drain work buffered by Push to Queue; prefer Clear queue when the aim is to empty the queue without reading the items. Not idempotent: every call consumes a further batch.', idempotent: false },
    displayName: 'Pull items from queue',
    props: {
        info: Property.MarkDown({
            value: notes,
        }),
        queueName: Property.ShortText({
            displayName: 'Queue Name',
            required: true,
        }),
        numOfItems: Property.Number({
            displayName: 'Number of items',
            required: true,
        })
    },
    async run(context) {
        const items = await poll({ store: context.store, queueName: context.propsValue.queueName, numOfItems: context.propsValue.numOfItems, testing: false })
        return items
    },
    async test(context) {
        const items = await poll({ store: context.store, queueName: context.propsValue.queueName, numOfItems: context.propsValue.numOfItems, testing: true })
        return items
    }
});

async function poll({ store, queueName, numOfItems, testing }: { store: Store, queueName: string, numOfItems: number, testing: boolean }) {
    const key = constructQueueName(queueName, testing)
    const allItems = await store.get<unknown[]>(key, StoreScope.PROJECT) || []
    const neededItems = allItems.splice(0, numOfItems)
    try {
        await store.put(key, allItems, StoreScope.PROJECT)
    } catch (e: unknown) {
        const name = (e as Error)?.name;
        if (name === 'StorageLimitError') {
            throw formatStorageError(e)
        } else {
            throw e
        }
    }
    return neededItems
}
