import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../auth';
import { makeClient, mondayCommon } from '../common';
import { parseMondayColumnValue } from '../common/helper';

export const getBoardItemValuesAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_board_values',
  classification: 'SEARCH',
  displayName: 'Get Board Values',
  description: 'Gets every item on a board with its column values.',
  audience: 'human',
  aiMetadata: { description: 'Retrieves all items on a monday.com board with their column values, optionally narrowed to specific column ids. Use to read or list the rows of a board. Read-only and idempotent.', idempotent: true },
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    column_ids: mondayCommon.columnIds(false),
  },
  async run(context) {
    const { board_id, column_ids } = context.propsValue;

    const client = makeClient(context.auth);
    const items = await client.getAllBoardItemValues({
      boardId: board_id as string,
      columnIds: column_ids as string[],
    });

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
