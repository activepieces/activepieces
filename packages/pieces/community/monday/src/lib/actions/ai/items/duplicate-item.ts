import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { duplicateItemActionOutputSchema } from '../../../output-schemas';

export const duplicateItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_duplicate_item',
  classification: 'WRITE',
  displayName: 'Duplicate Item',
  description: 'Creates a copy of an item on the same board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Duplicate a monday.com item on its board, copying its column values and optionally its updates; returns the new item. Use Create Board Item to start from scratch instead. Each call creates another copy, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: duplicateItemActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    item_id: mondayAiProps.itemId(),
    with_updates: Property.Checkbox({
      displayName: 'Include Updates',
      description: 'Also copy the item\'s updates.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { board_id, item_id, with_updates } = context.propsValue;

    const data = await makeClient(context.auth).query<{ duplicate_item: MondayItemSummary }>({
      query: `mutation ($boardId: ID!, $itemId: ID!, $withUpdates: Boolean) {
        duplicate_item(board_id: $boardId, item_id: $itemId, with_updates: $withUpdates) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        boardId: board_id,
        itemId: item_id,
        withUpdates: with_updates ?? false,
      },
    });

    return itemCommon.mapItemSummary(data.duplicate_item);
  },
});
