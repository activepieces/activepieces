import {
    Property,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';

export const pullToQueue = createAction({
    name: 'pull-to-queue',
    description: 'Pull items from queue',
    displayName: 'Pull items from queue',
    props: {
        queueName: Property.ShortText({
            displayName: 'Queue Name',
            description: 'Name of the queue to pull from',
            required: true,
        }),
        numOfItems: Property.Number({
            displayName: 'Number of items',
            description: 'Number of items to pull',
            required: true,
        }),
        testPull: Property.MarkDown({
            value: `
            When you test this action, it will will not pull the items out of the queue.
            `,
        }),
    },
    async run(context) {
        const neededItems = pullFromQueue(context)
        const allItems: any[] = await context.store.get(context.propsValue.queueName, StoreScope.PROJECT) || []

        for (let i = 0; i < Math.min(context.propsValue.numOfItems, allItems.length); i++) {
            allItems.shift()
        }

        await context.store.put(context.propsValue.queueName, allItems, StoreScope.PROJECT)

        return neededItems
    },
    async test(context) {
        return await pullFromQueue(context)
    }
});

const pullFromQueue = async (context: any) => {
    const items = await context.store.get(context.propsValue.queueName, StoreScope.PROJECT) || []
    const numOfItems = context.propsValue.numOfItems
    const neededItems = []

    for (let i = 0 ; i < Math.min(numOfItems, items.length); i++){
        neededItems.push(items[i])
    }

    return neededItems
}