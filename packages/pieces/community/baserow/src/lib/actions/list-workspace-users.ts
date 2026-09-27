import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { listWorkspaceUsersOutputSchema } from '../output-schemas';

export const listWorkspaceUsersAction = createAction({
  name: 'baserow_list_workspace_users',
  classification: 'SEARCH',
  outputSchema: listWorkspaceUsersOutputSchema,
  displayName: 'List Workspace Users',
  description: 'Lists the members of a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the members of a Baserow workspace with user ID, name, email and role. Use to find the user ID needed for collaborator fields ([{"id": <user_id>}]). Only workspace admins can call it, with an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    workspace_id: baserowAiProps.workspaceIdProp(),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only return users whose name or email contains this text.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, search } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'List Workspace Users' });
    const client = await makeClient(context.auth);
    const users = await baserowAiHelpers.execute(() =>
      client.listWorkspaceUsers({ workspaceId: workspace_id, search: search ?? undefined })
    );
    return {
      count: users.length,
      users: users.map((user) => ({
        user_id: user['user_id'],
        name: user['name'],
        email: user['email'],
        permissions: user['permissions'],
      })),
    };
  },
});
