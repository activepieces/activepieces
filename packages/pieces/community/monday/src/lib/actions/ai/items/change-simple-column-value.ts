import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { changeSimpleColumnValueActionOutputSchema } from '../../../output-schemas';

export const changeSimpleColumnValueAction = createAction({
  auth: mondayAuth,
  name: 'monday_change_simple_column_value',
  classification: 'WRITE',
  displayName: 'Change Simple Column Value',
  description: 'Sets one column of an item using a plain string.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set a single column on a monday.com item from a plain string, e.g. a status or dropdown label ("Done"), text, a number, or a date ("2026-01-31"). Use Change Column Value for structured JSON values (people, timeline, link) and Set Item Column Values to change several columns at once. An empty string clears the column. Safe to retry.',
    idempotent: true,
  },
  outputSchema: changeSimpleColumnValueActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    item_id: mondayAiProps.itemId(),
    column_id: mondayAiProps.columnId(),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The new value as a string. Leave empty to clear the column.',
      required: false,
    }),
    create_labels_if_missing: Property.Checkbox({
      displayName: 'Create Labels If Missing',
      description: 'Create a missing status/dropdown label. Requires permission to change the board structure.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { board_id, item_id, column_id, value, create_labels_if_missing } = context.propsValue;

    const data = await makeClient(context.auth).query<{ change_simple_column_value: MondayItemSummary }>({
      query: `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String, $createLabels: Boolean) {
        change_simple_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value, create_labels_if_missing: $createLabels) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        boardId: board_id,
        itemId: item_id,
        columnId: column_id,
        value: value ?? '',
        createLabels: create_labels_if_missing ?? false,
      },
    });

    return itemCommon.mapItemSummary(data.change_simple_column_value);
  },
});
