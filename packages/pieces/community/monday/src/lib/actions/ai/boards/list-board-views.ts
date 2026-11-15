import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { listBoardViewsActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const listBoardViewsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_board_views',
  classification: 'SEARCH',
  displayName: 'List Board Views',
  description: 'Lists the views of a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the views (table, kanban, form, dashboard, etc.) configured on a monday.com board, with their type and access level. Use to discover a board’s views or find a form view. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listBoardViewsActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
  },
  async run(context) {
    const boardId = context.propsValue.board_id;

    const data = await makeClient(context.auth).query<{ boards: { views: MondayView[] | null }[] }>({
      query: `query ($ids: [ID!]) {
        boards(ids: $ids) {
          views { id name type access_level source_view_id }
        }
      }`,
      variables: { ids: [boardId] },
    });

    if (data.boards.length === 0) {
      throw new Error(`Board ${boardId} was not found or is not accessible.`);
    }

    const views = (data.boards[0].views ?? []).map((view) => ({
      id: view.id,
      name: view.name,
      type: view.type,
      access_level: view.access_level,
      source_view_id: view.source_view_id ?? null,
      board_id: boardId,
    }));

    return { views, count: views.length };
  },
});

type MondayView = {
  id: string;
  name: string;
  type: string;
  access_level: string;
  source_view_id: string | null;
};
