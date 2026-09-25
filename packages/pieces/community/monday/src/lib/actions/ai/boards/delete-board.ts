import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { deleteBoardActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const deleteBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_board',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Board',
  description: 'Deletes a board and all of its items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a monday.com board together with all its groups, items and updates. Destructive: only use when the user explicitly asks to delete; prefer Archive Board, which is recoverable. Requires board-owner rights; a retry after success fails because the board is gone.',
    idempotent: false,
  },
  outputSchema: deleteBoardActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
  },
  async run(context) {
    const data = await makeClient(context.auth).query<{ delete_board: { id: string; name: string; state: string } }>({
      query: `mutation ($board_id: ID!) {
        delete_board(board_id: $board_id) { id name state }
      }`,
      variables: { board_id: context.propsValue.board_id },
    });

    return {
      id: data.delete_board.id,
      name: data.delete_board.name,
      state: data.delete_board.state,
    };
  },
});
