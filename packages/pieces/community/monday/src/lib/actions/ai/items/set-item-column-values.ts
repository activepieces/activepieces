import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { setItemColumnValuesActionOutputSchema } from '../../../output-schemas';

export const setItemColumnValuesAction = createAction({
  auth: mondayAuth,
  name: 'monday_set_item_column_values',
  classification: 'WRITE',
  displayName: 'Set Item Column Values',
  description: 'Updates several column values of an item at once.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update several column values on an existing monday.com item in one call, given a JSON map of column ID to value; only the listed columns change. Prefer Change Simple Column Value for a single text/status/dropdown label, and Change Column Value for one complex column. File columns cannot be set here (use Upload File). Safe to retry: re-applying the same values converges on the same state.',
    idempotent: true,
  },
  outputSchema: setItemColumnValuesActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    item_id: mondayAiProps.itemId(),
    column_values: Property.Json({
      displayName: 'Column Values',
      description:
        'JSON map of column ID to value, e.g. {"status": {"label": "Done"}, "numbers": "42", "people": {"personsAndTeams": [{"id": 123, "kind": "person"}]}}.',
      required: true,
    }),
    create_labels_if_missing: Property.Checkbox({
      displayName: 'Create Labels If Missing',
      description: 'Create missing status/dropdown labels. Requires permission to change the board structure.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { board_id, item_id, column_values, create_labels_if_missing } = context.propsValue;

    const data = await makeClient(context.auth).query<{ change_multiple_column_values: MondayItemSummary }>({
      query: `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!, $createLabels: Boolean) {
        change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues, create_labels_if_missing: $createLabels) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        boardId: board_id,
        itemId: item_id,
        columnValues: mondayApi.toJsonString(column_values),
        createLabels: create_labels_if_missing ?? false,
      },
    });

    return itemCommon.mapItemSummary(data.change_multiple_column_values);
  },
});
