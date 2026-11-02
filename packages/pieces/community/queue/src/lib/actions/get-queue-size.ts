import { Property, Store, createAction } from '@activepieces/pieces-framework';
import { constructQueueName, queueNameProp, readQueue, sharedNotes } from '../common';
import { getQueueSizeOutputSchema } from '../output-schemas';

const notes = `**Note:**
- Counts the items waiting in the queue without reading or removing them. A queue that was never used counts as empty.
${sharedNotes}
`;

export const getQueueSize = createAction({
  audience: 'both',
  name: 'get-queue-size',
  classification: 'READ',
  displayName: 'Get Queue Size',
  description: 'Count the items waiting in a queue',
  aiMetadata: {
    description:
      'Counts the items currently waiting in a named project-scoped FIFO queue without reading or removing them. Use it as a guard before Pull items from queue or to branch on backlog size; use Peek at Queue when the items themselves are needed. Requires the exact queue name used by Push to Queue. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getQueueSizeOutputSchema,
  props: {
    info: Property.MarkDown({
      value: notes,
    }),
    queueName: queueNameProp,
  },
  async run(context) {
    return getSize({ store: context.store, queueName: context.propsValue.queueName, testing: false });
  },
  async test(context) {
    return getSize({ store: context.store, queueName: context.propsValue.queueName, testing: true });
  },
});

async function getSize({ store, queueName, testing }: { store: Store; queueName: string; testing: boolean }) {
  const key = constructQueueName(queueName, testing);
  const allItems = await readQueue({ store, key, queueName });
  return {
    queueName,
    size: allItems.length,
    isEmpty: allItems.length === 0,
  };
}
