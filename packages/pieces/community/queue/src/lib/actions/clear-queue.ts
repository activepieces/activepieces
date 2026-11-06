import {
    MarkdownVariant,
    Property,
    StoreScope,
    createAction,
} from '@activepieces/pieces-framework';
import { constructQueueName, queueNameProp } from '../common';
import { clearQueueOutputSchema } from '../output-schemas';


const notes = 'Testing this step on its own clears only the separate test queue. Test Flow and published runs clear the real one.'

const warning = 'Deletes every item in this queue permanently, for every flow in the project that uses it.'

export const clearQueue = createAction({
  audience: 'both',
    name: 'clear-queue',
    classification: 'DESTRUCTIVE',
    description: 'Delete every item in a queue',
    aiMetadata: { description: 'Permanently deletes a named project-scoped queue and every item stored in it, keyed by the exact queue name. Use it to reset a queue wholesale; prefer Pull Items from Queue when the buffered items still need to be read and processed. Idempotent: the queue ends up empty however many times it runs, and clearing an already-empty or never-created queue still succeeds.', idempotent: true },
    displayName: 'Clear Queue',
    outputSchema: clearQueueOutputSchema,
    props: {
        info: Property.MarkDown({
            value: notes,
        }),
        warning: Property.MarkDown({
            value: warning,
            variant: MarkdownVariant.WARNING,
        }),
        queueName: queueNameProp,
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
