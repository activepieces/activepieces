import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { removeBoardSubscribersActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const removeBoardSubscribersAction = createAction({
  auth: mondayAuth,
  name: 'monday_remove_board_subscribers',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Users from Board',
  description: 'Removes users from a board.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Revoke users' subscriber or owner access to a monday.com board. Use to unshare a board with specific people; to remove a whole team use Remove Teams from Board. Requires board-owner rights. Removing users who are no longer members has no further effect.",
    idempotent: true,
  },
  outputSchema: removeBoardSubscribersActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    user_ids: mondayAiProps.userIds(),
  },
  async run(context) {
    const { board_id } = context.propsValue;
    const userIds = mondayApi.toStringArray(context.propsValue.user_ids);
    if (userIds.length === 0) {
      throw new Error('Provide at least one user ID.');
    }

    const data = await makeClient(context.auth).query<{ delete_subscribers_from_board: { id: string; name: string }[] | null }>({
      query: `mutation ($board_id: ID!, $user_ids: [ID!]!) {
        delete_subscribers_from_board(board_id: $board_id, user_ids: $user_ids) { id name }
      }`,
      variables: { board_id, user_ids: userIds },
    });

    const users = (data.delete_subscribers_from_board ?? []).map((user) => ({
      id: user.id,
      name: user.name,
    }));

    return { board_id, removed_users: users, count: users.length };
  },
});
