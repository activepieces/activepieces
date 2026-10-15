import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { deleteUsersFromWorkspaceActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const deleteUsersFromWorkspaceAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_users_from_workspace',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Users from Workspace',
  description: 'Removes users from a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Revoke users' membership of a monday.com workspace. Use for individual people; to remove a whole team use Remove Teams from Workspace. Removing users who are no longer members has no further effect.",
    idempotent: true,
  },
  outputSchema: deleteUsersFromWorkspaceActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
    user_ids: mondayAiProps.userIds(),
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    const ids = mondayApi.toStringArray(context.propsValue.user_ids);
    if (ids.length === 0) {
      throw new Error('Provide at least one user ID.');
    }

    const data = await makeClient(context.auth).query<{ delete_users_from_workspace: { id: string; name: string }[] | null }>({
      query: `mutation ($workspace_id: ID!, $user_ids: [ID!]!) {
        delete_users_from_workspace(workspace_id: $workspace_id, user_ids: $user_ids) { id name }
      }`,
      variables: { workspace_id, user_ids: ids },
    });

    const users = (data.delete_users_from_workspace ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
    }));

    return { workspace_id, removed_users: users, count: users.length };
  },
});
