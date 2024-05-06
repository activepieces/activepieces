import {
    Property,
    Store,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName } from '../common';

export const pullFromQueue = createAction({
    name: 'pull-from-queue',
    description: 'Pull items from queue',
    displayName: 'Pull items from queue',
    props: {
        info: Property.MarkDown({
            value: `
            **Note:**
            - You can pull items from other flows. The queue name should be unique across all flows.
            - The testing step work in isolation and doesn't affect the actual queue after publishing.
            `,
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
    await store.put(key, allItems, StoreScope.PROJECT)
    return neededItems
}
