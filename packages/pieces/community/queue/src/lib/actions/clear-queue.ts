import {
    Property,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName } from '../common';


const notes = `**Note:**
- This deletes all items inside the queue permanently.
- The testing step work in isolation and doesn't affect the actual queue after publishing.
`
export const clearQueue = createAction({
  audience: 'both',
    name: 'clear-queue',
    description: 'Clears all items inside a queue',
    aiMetadata: { description: 'Permanently deletes a named project-scoped queue and every item stored in it, keyed by the exact queue name. Use it to reset a queue wholesale; prefer Pull items from queue when the buffered items still need to be read and processed. Idempotent: the queue ends up empty however many times it runs, and clearing an already-empty or never-created queue still succeeds.', idempotent: true },
    displayName: 'Clear queue',
    props: {
        info: Property.MarkDown({
            value: notes,
        }),
        queueName: Property.ShortText({
            displayName: 'Queue Name',
            required: true,
        })
    },
    async run(context) {
        const queueName = constructQueueName(context.propsValue.queueName, false)
        await context.store.delete(queueName, StoreScope.PROJECT)
        return {
            success: true
        }
    },
    async test(context) {
        const queueName = constructQueueName(context.propsValue.queueName, true)
        await context.store.delete(queueName, StoreScope.PROJECT)
        return {
            success: true
        }
    }
});
