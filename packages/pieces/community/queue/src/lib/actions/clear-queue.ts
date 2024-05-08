import {
    Property,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName } from '../common';

export const clearQueue = createAction({
    name: 'clear-queue',
    description: 'Clears all items inside a queue',
    displayName: 'Clear queue',
    props: {
        info: Property.MarkDown({
            value: `
            **Note:**
            - This deletes all items inside the queue permanently.
            - The testing step work in isolation and doesn't affect the actual queue after publishing.
            `,
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
