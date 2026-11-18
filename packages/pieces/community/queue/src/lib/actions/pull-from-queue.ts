import {
    Property,
    Store,
    createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName, queueNameProp, readQueue, sharedNotes, validateItemCount, writeQueue } from '../common';
import { pullFromQueueOutputSchema } from '../output-schemas';

const notes = `**Note:**
- Pulled items are removed from the queue right away, oldest first. If a later step fails, they are not put back.
- Fewer items come back when the queue holds fewer than requested, and none when it is empty.
${sharedNotes}
`
export const pullFromQueue = createAction({
  audience: 'both',
    name: 'pull-from-queue',
    classification: 'DESTRUCTIVE',
    description: 'Pull items from queue',
    aiMetadata: { description: 'Removes and returns the first N items of a named project-scoped FIFO queue and writes the remainder back, so it is a destructive consume - the returned items are gone from the queue, and fewer than requested come back when the queue holds less. Use it to drain work buffered by Push to Queue; prefer Peek at Queue to read items without removing them, and Clear queue to empty the queue without reading it. The number of items must be a whole number of 0 or more. Not idempotent: every call consumes a further batch, and parallel runs pulling the same queue can receive the same items.', idempotent: false },
    displayName: 'Pull items from queue',
    outputSchema: pullFromQueueOutputSchema,
    props: {
        info: Property.MarkDown({
            value: notes,
        }),
        queueName: queueNameProp,
        numOfItems: Property.Number({
            displayName: 'Number of items',
            description: 'How many items to take from the front of the queue (a whole number, 0 or more).',
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
    const count = validateItemCount({ value: numOfItems, fieldName: 'Number of items' })
    const key = constructQueueName(queueName, testing)
    const allItems = await readQueue({ store, key, queueName })
    const neededItems = allItems.slice(0, count)
    if (neededItems.length === 0) {
        return neededItems
    }
    await writeQueue({ store, key, queueName, items: allItems.slice(count) })
    return neededItems
}
