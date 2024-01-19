import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import { parseMondayColumnValue } from '../common/helper';

export const getBoardItemValuesAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_board_values',
  displayName: 'Get Board Values',
  description: "Gets a list of board's items.",
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    column_ids: mondayCommon.columnIds(false),
  },
  async run(context) {
    const { board_id, column_ids } = context.propsValue;

    const client = makeClient(context.auth as string);
    const res = await client.getBoardItemValues({
      boardId: board_id as string,
      columnIds: column_ids as string[],
    });
    const items = res.data.boards[0].items_page.items;

    const result = [];
    for (const item of items) {
      const transformedValues: Record<string, any> = {
        id: item.id,
        name: item.name,
      };
      for (const column of item.column_values) {
        transformedValues[column.id] = parseMondayColumnValue(column);
      }
      result.push(transformedValues);
    }

    return result;
  },
});
