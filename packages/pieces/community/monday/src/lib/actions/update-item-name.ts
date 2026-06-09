import { Property, createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../auth';
import { makeClient, mondayCommon } from '../common';

export const updateItemNameAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_item_name',
  displayName: 'Update Item Name',
  description: 'Updates an item name.',
  audience: 'both',
  aiMetadata: { description: 'Renames an existing monday.com item identified by board and item id. Use to change an item\'s title. Idempotent: re-applying the same name leaves the item unchanged.', idempotent: true },
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    item_id: mondayCommon.item_id(true),
    name: Property.ShortText({
      displayName: 'New Item name',
      required: true,
    }),
  },
  async run(context) {
    const { board_id, item_id, name } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.updateItem({
      boardId: board_id,
      itemId: item_id,
      columnValues: JSON.stringify({ name: name }),
    });
  },
});
