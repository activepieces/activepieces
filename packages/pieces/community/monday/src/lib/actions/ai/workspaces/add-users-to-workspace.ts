import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { addUsersToWorkspaceActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const addUsersToWorkspaceAction = createAction({
  auth: mondayAuth,
  name: 'monday_add_users_to_workspace',
  classification: 'WRITE',
  displayName: 'Add Users to Workspace',
  description: 'Adds users to a workspace as subscribers or owners.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Add users to a monday.com workspace as subscribers or owners so they can see its boards and docs. Use for individual people; to add a whole team use Add Teams to Workspace. It sets each user role to the chosen kind, so adding an existing owner as a subscriber demotes them; repeating the same call is safe to retry.",
    idempotent: true,
  },
  outputSchema: addUsersToWorkspaceActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
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
    const { workspace_id, kind } = context.propsValue;
    const ids = mondayApi.toStringArray(context.propsValue.user_ids);
    if (ids.length === 0) {
      throw new Error('Provide at least one user ID.');
    }

    const data = await makeClient(context.auth).query<{ add_users_to_workspace: { id: string; name: string }[] | null }>({
      query: `mutation ($workspace_id: ID!, $user_ids: [ID!]!, $kind: WorkspaceSubscriberKind) {
        add_users_to_workspace(workspace_id: $workspace_id, user_ids: $user_ids, kind: $kind) { id name }
      }`,
      variables: { workspace_id, user_ids: ids, kind },
    });

    const users = (data.add_users_to_workspace ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
    }));

    return { workspace_id, role: kind, users: users, count: users.length };
  },
});
