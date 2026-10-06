import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';
import { deleteGroupActionOutputSchema } from '../../../output-schemas';

export const deleteGroupAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Group',
  description: 'Deletes a group and all of its items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a group and every item in it from a monday.com board. Prefer Archive Group when the items may be needed later. A board\'s last remaining group cannot be deleted. A retry after success fails because the group no longer exists.',
    idempotent: false,
  },
  outputSchema: deleteGroupActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(true),
    group_id: mondayAiProps.groupId(true),
  },
  async run(context) {
    const { board_id, group_id } = context.propsValue;

    const data = await makeClient(context.auth).query<{ delete_group: { id: string } }>({
      query: `mutation ($boardId: ID!, $groupId: String!) {
        delete_group(board_id: $boardId, group_id: $groupId) { id }
      }`,
      variables: { boardId: board_id, groupId: group_id },
    });

    return { id: data.delete_group.id, board_id, deleted: true };
  },
});
