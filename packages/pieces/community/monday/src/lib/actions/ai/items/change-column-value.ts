import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { changeColumnValueActionOutputSchema } from '../../../output-schemas';

export const changeColumnValueAction = createAction({
  auth: mondayAuth,
  name: 'monday_change_column_value',
  classification: 'WRITE',
  displayName: 'Change Column Value',
  description: 'Sets one column of an item using a JSON value.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set a single column on a monday.com item using the column type\'s JSON value format, e.g. timeline {"from": "2026-01-01", "to": "2026-01-31"}, people {"personsAndTeams": [{"id": 123, "kind": "person"}]}, or {"clear_all": true} to clear a file column. Get the exact format with Get Column Type Schema. Use Change Simple Column Value for plain labels/text. Safe to retry.',
    idempotent: true,
  },
  outputSchema: changeColumnValueActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    item_id: mondayAiProps.itemId(),
    column_id: mondayAiProps.columnId(),
    value: Property.Json({
      displayName: 'Value',
      description: 'The column value as a JSON object, in the format for that column type.',
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
    const { board_id, item_id, column_id, value, create_labels_if_missing } = context.propsValue;

    const data = await makeClient(context.auth).query<{ change_column_value: MondayItemSummary }>({
      query: `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!, $createLabels: Boolean) {
        change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value, create_labels_if_missing: $createLabels) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        boardId: board_id,
        itemId: item_id,
        columnId: column_id,
        value: mondayApi.toJsonString(value),
        createLabels: create_labels_if_missing ?? false,
      },
    });

    return itemCommon.mapItemSummary(data.change_column_value);
  },
});
