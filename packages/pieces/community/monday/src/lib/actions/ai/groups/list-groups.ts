import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { listGroupsActionOutputSchema } from '../../../output-schemas';

export const listGroupsAction = createAction({
  auth: mondayAuth,
  name: 'monday_list_groups',
  classification: 'SEARCH',
  displayName: 'List Groups',
  description: 'Lists the groups of a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the groups (sections that hold items) of a monday.com board with each group\'s ID, title, color and archived state. Use to resolve a group ID before creating, moving or filtering items. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listGroupsActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
  },
  async run(context) {
    const { board_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ boards: { id: string; groups: MondayGroup[] | null }[] }>({
      query: `query ($boardIds: [ID!]) {
        boards(ids: $boardIds) {
          id
          groups { id title color archived deleted }
        }
      }`,
      variables: { boardIds: [board_id] },
    });

    const board = data.boards[0];
    if (!board) {
      throw new Error(`Board ${board_id} was not found or is not accessible.`);
    }

    const groups = (board.groups ?? []).map((group) => ({
      id: group.id,
      title: group.title,
      color: group.color,
      archived: group.archived ?? false,
      deleted: group.deleted ?? false,
    }));

    return { board_id: board.id, groups, count: groups.length };
  },
});

type MondayGroup = {
  id: string;
  title: string;
  color: string;
  archived: boolean | null;
  deleted: boolean | null;
};
