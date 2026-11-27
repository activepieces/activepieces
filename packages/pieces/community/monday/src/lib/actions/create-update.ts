import { Property, createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../auth';
import { makeClient } from '../common';
import { createUpdateActionOutputSchema } from '../output-schemas';

export const createUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_update',
  classification: 'WRITE',
  displayName: 'Create Update',
  description: 'Posts an update on an item.',
  audience: 'human',
  aiMetadata: { description: 'Posts an update (a comment/note in the item\'s update feed) to a monday.com item identified by item id. Use to add a message or log to an item. Not idempotent: each call appends a new update.', idempotent: false },
  outputSchema: createUpdateActionOutputSchema,
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description: 'The ID of the item, shown in its URL.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      placeholder: 'Write your update…',
      required: true,
    }),
  },
  async run(context) {
    const { item_id, body } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.createUpdate({
      itemId: item_id as string,
      body: body as string,
    });
  },
});
