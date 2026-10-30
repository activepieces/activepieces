import { Property, Store, createAction } from '@activepieces/pieces-framework';
import { constructQueueName, queueNameProp, readQueue, sharedNotes, validateItemCount } from '../common';
import { peekQueueOutputSchema } from '../output-schemas';

const DEFAULT_PEEK_COUNT = 1;

const notes = `**Note:**
- Returns the oldest items in the queue without removing them, plus the total number of items queued.
${sharedNotes}
`;

export const peekQueue = createAction({
  audience: 'both',
  name: 'peek-queue',
  classification: 'READ',
  displayName: 'Peek at Queue',
  description: 'Read the oldest items in a queue without removing them',
  aiMetadata: {
    description:
      'Reads the first N items of a named project-scoped FIFO queue without removing them. Use it to inspect pending work or decide whether to pull; use Pull items from queue to consume items, or Get Queue Size when only the count matters. Requires the exact queue name used by Push to Queue; the number of items defaults to 1 and must be a whole number of 0 or more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: peekQueueOutputSchema,
  props: {
    info: Property.MarkDown({
      value: notes,
    }),
    queueName: queueNameProp,
    numOfItems: Property.Number({
      displayName: 'Number of items',
      description: `How many items to read from the front of the queue (a whole number, 0 or more). Defaults to ${DEFAULT_PEEK_COUNT}.`,
      required: false,
      defaultValue: DEFAULT_PEEK_COUNT,
    }),
  },
  async run(context) {
    return peek({ store: context.store, queueName: context.propsValue.queueName, numOfItems: context.propsValue.numOfItems, testing: false });
  },
  async test(context) {
    return peek({ store: context.store, queueName: context.propsValue.queueName, numOfItems: context.propsValue.numOfItems, testing: true });
  },
});

async function peek({ store, queueName, numOfItems, testing }: { store: Store; queueName: string; numOfItems: number | undefined | null; testing: boolean }) {
  const count = validateItemCount({ value: numOfItems ?? DEFAULT_PEEK_COUNT, fieldName: 'Number of items' });
  const key = constructQueueName(queueName, testing);
  const allItems = await readQueue({ store, key, queueName });
  const items = allItems.slice(0, count);
  return {
    items,
    itemCount: items.length,
    queueSize: allItems.length,
  };
}
