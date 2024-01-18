import { Property, createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient } from '../common';

export const createUpdateAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_update',
  displayName: 'Create Update',
  description: 'Creates a new update.',
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

    const client = makeClient(context.auth as string);
    return await client.createUpdate({
      itemId: item_id as string,
      body: body as string,
    });
  },
});
