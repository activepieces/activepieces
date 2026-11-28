import {
  DynamicPropsValue,
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { mondayAuth } from '../auth';
import { makeClient, mondayCommon } from '../common';
import {
  convertPropValueToMondayColumnValue,
  generateColumnIdTypeMap,
} from '../common/helper';
import { updateColumnValuesOfItemActionOutputSchema } from '../output-schemas';

function isEmptyColumnValue(value: unknown): boolean {
  return (
    value === '' ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

export const updateColumnValuesOfItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_column_values_of_item',
  classification: 'WRITE',
  displayName: 'Update Item Column Values',
  description: 'Changes column values of an existing item.',
  audience: 'human',
  aiMetadata: { description: 'Updates one or more column values on an existing monday.com item identified by board and item id; provided values are auto-coerced to each column\'s type. Use to edit an item\'s fields. Idempotent: re-applying the same values leaves the item in the same state.', idempotent: true },
  outputSchema: updateColumnValuesOfItemActionOutputSchema,
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    item_id: mondayCommon.item_id(true),
    info: Property.MarkDown({
      value: 'Columns you leave empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    column_values: mondayCommon.columnValues,
  },
  async run(context) {
    const { board_id, item_id } = context.propsValue;
    const columnValuesInput = context.propsValue.column_values;
    const mondayColumnValues: DynamicPropsValue = {};

    const client = makeClient(context.auth);
    const res = await client.listBoardColumns({
      boardId: board_id as unknown as string,
    });
    const columns = res.data.boards[0]?.columns;

    // map board column id with column type
    const columnIdTypeMap = generateColumnIdTypeMap(columns);

    Object.keys(columnValuesInput).forEach((key) => {
      if (!isEmptyColumnValue(columnValuesInput[key])) {
        const columnType: string = columnIdTypeMap[key];
        mondayColumnValues[key] = convertPropValueToMondayColumnValue(
          columnType,
          columnValuesInput[key]
        );
      }
    });

    return await client.updateItem({
      boardId: board_id,
      itemId: item_id,
      columnValues: JSON.stringify(mondayColumnValues),
    });
  },
});
