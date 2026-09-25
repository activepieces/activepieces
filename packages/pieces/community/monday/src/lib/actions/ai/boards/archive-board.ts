import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { archiveBoardActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const archiveBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_archive_board',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Board',
  description: 'Archives a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archive a monday.com board so it leaves active views but can be restored from the archive in the monday.com UI. Prefer this over Delete Board when a board is no longer needed. Fails if the board is already archived.',
    idempotent: false,
  },
  outputSchema: archiveBoardActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
  },
  async run(context) {
    const data = await makeClient(context.auth).query<{ archive_board: { id: string; name: string; state: string } }>({
      query: `mutation ($board_id: ID!) {
        archive_board(board_id: $board_id) { id name state }
      }`,
      variables: { board_id: context.propsValue.board_id },
    });

    return {
      id: data.archive_board.id,
      name: data.archive_board.name,
      state: data.archive_board.state,
    };
  },
});
