import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { addUsersToBoardActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const addUsersToBoardAction = createAction({
  auth: mondayAuth,
  name: 'monday_add_users_to_board',
  classification: 'WRITE',
  displayName: 'Add Users to Board',
  description: 'Adds users to a board as subscribers or owners.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Give users access to a monday.com board as subscribers or owners. Use to share a board with specific people; to share with a whole team use Add Teams to Board. Requires board-owner rights. It sets each user role to the chosen kind, so adding an existing owner as a subscriber demotes them; repeating the same call is safe to retry.',
    idempotent: true,
  },
  outputSchema: addUsersToBoardActionOutputSchema,
  props: {
    board_id: mondayAiProps.boardId(),
    user_ids: mondayAiProps.userIds(),
    kind: Property.StaticDropdown({
      displayName: 'Role',
      required: true,
      defaultValue: 'subscriber',
      options: {
        options: [
          { label: 'Subscriber', value: 'subscriber' },
          { label: 'Owner', value: 'owner' },
        ],
      },
    }),
  },
  async run(context) {
    const { board_id, kind } = context.propsValue;
    const userIds = mondayApi.toStringArray(context.propsValue.user_ids);
    if (userIds.length === 0) {
      throw new Error('Provide at least one user ID.');
    }

    const data = await makeClient(context.auth).query<{ add_users_to_board: MondayUser[] | null }>({
      query: `mutation ($board_id: ID!, $user_ids: [ID!]!, $kind: BoardSubscriberKind) {
        add_users_to_board(board_id: $board_id, user_ids: $user_ids, kind: $kind) { id name email }
      }`,
      variables: { board_id, user_ids: userIds, kind },
    });

    const users = (data.add_users_to_board ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email ?? null,
    }));

    return { board_id, role: kind, users, count: users.length };
  },
});

type MondayUser = {
  id: string;
  name: string;
  email: string | null;
};
