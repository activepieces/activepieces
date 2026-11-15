import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { ITEM_SUMMARY_FIELDS, itemCommon, MondayItemSummary } from './item-common';
import { makeClient } from '../../../common';
import { createBoardItemActionOutputSchema } from '../../../output-schemas';

export const createBoardItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_board_item',
  classification: 'WRITE',
  displayName: 'Create Board Item',
  description: 'Creates an item on a board with optional column values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new item (row) on a monday.com board by board ID, optionally in a specific group and with column values given as a JSON map of column ID to value. Use Create Subitem for a child item instead. Check column IDs and value formats with List Columns and Get Column Type Schema first. Each call creates a new item, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createBoardItemActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    item_name: Property.ShortText({
      displayName: 'Item Name',
      required: true,
    }),
    group_id: mondayAiProps.groupId(false),
    column_values: Property.Json({
      displayName: 'Column Values',
      description:
        'JSON map of column ID to value, e.g. {"status": {"label": "Done"}, "date4": {"date": "2026-01-31"}, "text": "Hello"}.',
      required: false,
    }),
    create_labels_if_missing: Property.Checkbox({
      displayName: 'Create Labels If Missing',
      description: 'Create missing status/dropdown labels. Requires permission to change the board structure.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { board_id, item_name, group_id, column_values, create_labels_if_missing } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_item: MondayItemSummary }>({
      query: `mutation ($boardId: ID!, $itemName: String!, $groupId: String, $columnValues: JSON, $createLabels: Boolean) {
        create_item(board_id: $boardId, item_name: $itemName, group_id: $groupId, column_values: $columnValues, create_labels_if_missing: $createLabels) {
          ${ITEM_SUMMARY_FIELDS}
        }
      }`,
      variables: {
        boardId: board_id,
        itemName: item_name,
        ...(isNil(group_id) || group_id === '' ? {} : { groupId: group_id }),
        ...(isNil(column_values) ? {} : { columnValues: mondayApi.toJsonString(column_values) }),
        createLabels: create_labels_if_missing ?? false,
      },
    });

    return itemCommon.mapItemSummary(data.create_item);
  },
});
