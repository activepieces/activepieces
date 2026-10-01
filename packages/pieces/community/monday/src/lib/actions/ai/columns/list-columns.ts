import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayApi } from '../../../common/monday-api';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { listColumnsActionOutputSchema } from '../../../output-schemas';

export const listColumnsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_columns',
  classification: 'SEARCH',
  displayName: 'List Columns',
  description: 'Lists the columns of a board with their IDs, types and settings.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the columns of a monday.com board with each column\'s ID, title, type, description and settings (e.g. status labels, dropdown options). Call this before writing column values to learn the column IDs and accepted labels; use Get Column Type Schema for the JSON shape of a type. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listColumnsActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    column_ids: Property.Array({
      displayName: 'Column IDs',
      description: 'Only return these columns. Leave empty for all columns.',
      required: false,
    }),
  },
  async run(context) {
    const { board_id } = context.propsValue;
    const columnIds = mondayApi.toStringArray(context.propsValue.column_ids);

    const data = await makeClient(context.auth).query<{ boards: { id: string; columns: MondayColumn[] | null }[] }>({
      query: `query ($boardIds: [ID!], $columnIds: [String]) {
        boards(ids: $boardIds) {
          id
          columns(ids: $columnIds) {
            id
            title
            type
            description
            settings
            archived
            width
          }
        }
      }`,
      variables: {
        boardIds: [board_id],
        ...(columnIds.length > 0 ? { columnIds } : {}),
      },
    });

    const board = data.boards[0];
    if (!board) {
      throw new Error(`Board ${board_id} was not found or is not accessible.`);
    }

    const columns = (board.columns ?? []).map((column) => ({
      id: column.id,
      title: column.title,
      type: column.type,
      description: column.description ?? null,
      settings: isNil(column.settings) ? null : JSON.stringify(column.settings),
      archived: column.archived,
      width: column.width ?? null,
    }));

    return { board_id: board.id, columns, count: columns.length };
  },
});

type MondayColumn = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  settings: unknown;
  archived: boolean;
  width: number | null;
};
