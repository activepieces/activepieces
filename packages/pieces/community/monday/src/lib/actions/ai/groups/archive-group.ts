import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { archiveGroupActionOutputSchema } from '../../../output-schemas';

export const archiveGroupAction = createAction({
  auth: mondayAuth,
  name: 'monday_archive_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Group',
  description: 'Archives a group and its items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archive a monday.com group, hiding it and its items from the board while keeping them restorable from the board archive in the monday.com UI. Prefer this over Delete Group when the items may be needed later. Archiving an already-archived group has no further effect.',
    idempotent: true,
  },
  outputSchema: archiveGroupActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    group_id: mondayAiProps.groupId(true),
  },
  async run(context) {
    const { board_id, group_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ archive_group: { id: string; title: string } }>({
      query: `mutation ($boardId: ID!, $groupId: String!) {
        archive_group(board_id: $boardId, group_id: $groupId) { id title }
      }`,
      variables: { boardId: board_id, groupId: group_id },
    });

    const group = data.archive_group;
    return { id: group.id, board_id, title: group.title, archived: true };
  },
});
