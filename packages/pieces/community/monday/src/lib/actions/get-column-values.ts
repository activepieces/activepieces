import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import { parseMondayColumnValue } from '../common/helper';

export const getItemsColumnValuesAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_item_column_values',
  displayName: "Get an Item's Column Values",
  description: 'Gets column values of an item.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    item_id: mondayCommon.item_id(true),
    column_ids: mondayCommon.columnIds(false),
  },
  async run(context) {
    const { board_id, item_id, column_ids } = context.propsValue;

    const client = makeClient(context.auth as string);
    const res = await client.getItemColumnValues({
      boardId: board_id as string,
      itemId: item_id as string,
      columnIds: column_ids as string[],
    });
    const item = res.data.boards[0].items_page.items[0];
    const transformedValues: Record<string, any> = {
      id: item.id,
      name: item.name,
    };
    for (const column of item.column_values) {
      transformedValues[column.id] = parseMondayColumnValue(column);
    }
    return transformedValues;
  },
});
