import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import {
  convertPropValueToMondayColumnValue,
  generateColumnIdTypeMap,
} from '../common/helper';

export const createItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_item',
  displayName: 'Create Item',
  description: 'Creates a new item inside a board.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    group_id: mondayCommon.group_id(false),
    item_name: Property.ShortText({
      displayName: 'Item Name',
      description: 'Item Name',
      required: true,
    }),
    column_values: mondayCommon.columnValues,
    create_labels_if_missing: Property.Checkbox({
      displayName: 'Create Labels if Missing',
      description:
        'Creates status/dropdown labels if they are missing. This requires permission to change the board structure.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const { board_id, item_name, create_labels_if_missing } =
      context.propsValue;
    const group_id = context.propsValue.group_id!;
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

    return await client.createItem({
      itemName: item_name,
      boardId: board_id,
      groupId: group_id,
      columnValues: JSON.stringify(mondayColumnValues),
      createLabels: create_labels_if_missing ?? false,
    });
  },
});
