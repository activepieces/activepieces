import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { deleteColumnActionOutputSchema } from '../../../output-schemas';

export const deleteColumnAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_column',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Column',
  description: 'Deletes a column and all its values from a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a column from a monday.com board, removing that column\'s values from every item. Cannot be undone through the API; to only rename use Update Column. A retry after success fails because the column no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteColumnActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    column_id: mondayAiProps.columnId(true),
  },
  async run(context) {
    const { board_id, column_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ delete_column: { id: string } }>({
      query: `mutation ($boardId: ID!, $columnId: String!) {
        delete_column(board_id: $boardId, column_id: $columnId) { id }
      }`,
      variables: { boardId: board_id, columnId: column_id },
    });

    return { id: data.delete_column.id, board_id, deleted: true };
  },
});
