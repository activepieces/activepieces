import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { renameItemActionOutputSchema } from '../../../output-schemas';

export const renameItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_rename_item',
  classification: 'WRITE',
  displayName: 'Rename Item',
  description: 'Changes the name of an item.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename an existing monday.com item or subitem (its name column) without touching other columns. Use Set Item Column Values to change other fields. Safe to retry: setting the same name leaves the item unchanged.',
    idempotent: true,
  },
  outputSchema: renameItemActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    item_id: mondayAiProps.itemId(),
    name: Property.ShortText({
      displayName: 'New Name',
      required: true,
    }),
  },
  async run(context) {
    const { board_id, item_id, name } = context.propsValue;

    const data = await makeClient(context.auth).query<{ change_multiple_column_values: MondayItemSummary }>({
      query: `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        boardId: board_id,
        itemId: item_id,
        columnValues: JSON.stringify({ name }),
      },
    });

    return itemCommon.mapItemSummary(data.change_multiple_column_values);
  },
});
