import {
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import {
  convertPropValueToMondayColumnValue,
  generateColumnIdTypeMap,
} from '../common/helper';

export const updateColumnValuesOfItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_update_column_values_of_item',
  displayName: 'Update Column Values of Specific Item',
  description: 'Updates multiple columns values of specific item.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    item_id: mondayCommon.item_id(true),
    column_values: mondayCommon.columnValues,
  },
  async run(context) {
    const { board_id, item_id } = context.propsValue;
    const columnValuesInput = context.propsValue.column_values;
    const mondayColumnValues: DynamicPropsValue = {};

    const client = makeClient(context.auth as string);
    const res = await client.listBoardColumns({
      boardId: board_id as unknown as string,
    });
    const columns = res.data.boards[0]?.columns;

    // map board column id with column type
    const columnIdTypeMap = generateColumnIdTypeMap(columns);

    Object.keys(columnValuesInput).forEach((key) => {
      if (columnValuesInput[key] !== '') {
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
