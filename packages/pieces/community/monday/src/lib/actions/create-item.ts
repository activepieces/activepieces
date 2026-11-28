import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { mondayAuth } from '../auth';
import { makeClient, mondayCommon } from '../common';
import {
  convertPropValueToMondayColumnValue,
  generateColumnIdTypeMap,
} from '../common/helper';
import { createItemActionOutputSchema } from '../output-schemas';

export const createItemAction = createAction({
  auth: mondayAuth,
  name: 'monday_create_item',
  classification: 'WRITE',
  displayName: 'Create Item',
  description: 'Adds a new item to a board.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new item (row) on a monday.com board, optionally placed in a group and pre-populated with column values that are auto-coerced to each column\'s type. Use to add a record to a board. Requires the board id and an item name; enable create-labels-if-missing only when allowed to modify board structure. Not idempotent: each call creates a separate item.', idempotent: false },
  outputSchema: createItemActionOutputSchema,
  propertyGroups: [
    {
      key: 'board',
      display: 'section',
      label: 'Board',
      icon: 'inbox',
      props: ['workspace_id', 'board_id', 'group_id'],
    },
    {
      key: 'item',
      display: 'section',
      label: 'Item',
      icon: 'tag',
      props: ['item_name', 'column_values'],
    },
  ],
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    group_id: mondayCommon.group_id(false),
    item_name: Property.ShortText({
      displayName: 'Item Name',
      required: true,
    }),
    column_values: mondayCommon.columnValues,
    create_labels_if_missing: Property.Checkbox({
      displayName: 'Create Missing Labels',
      description:
        'Adds missing status or dropdown labels. Needs board edit rights.',
      advanced: true,
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

    const client = makeClient(context.auth);
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
