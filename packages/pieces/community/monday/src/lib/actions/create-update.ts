import { Property, createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../auth';
import { makeClient } from '../common';

export const createUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_update',
  displayName: 'Create Update',
  description: 'Creates a new update.',
  audience: 'both',
  aiMetadata: { description: 'Posts an update (a comment/note in the item\'s update feed) to a monday.com item identified by item id. Use to add a message or log to an item. Not idempotent: each call appends a new update.', idempotent: false },
  props: {
    item_id: Property.ShortText({
      displayName: 'Item ID',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
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
