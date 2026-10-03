import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaRemoveUserFromWorkspaceOutputSchema } from '../../output-schemas';

export const asanaRemoveUserFromWorkspaceAction = createAction({
  auth: asanaAuth,
  name: 'remove_user_from_workspace',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove User from Workspace',
  description: 'Remove a user from an Asana workspace or organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a user from a workspace or organization. Admin only. Ownership of the removed user\'s resources is transferred to the connected user, and their private resources become inaccessible unless they were made public before removal; re-adding the user does not restore that. Confirm with the user first. Not idempotent: a repeat call on a removed user fails.',
    idempotent: false,
  },
  outputSchema: asanaRemoveUserFromWorkspaceOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace or organization. Obtain it from List Workspaces.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      description: 'User to remove: an email address or a user gid. Obtain it from List Users or List Workspace Memberships.',
      required: true,
    }),
  },
  async run(context) {
    const workspace = context.propsValue.workspace.trim();
    const user = context.propsValue.user.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/workspaces/${asanaUtils.pathSegment(workspace)}/removeUser`,
      operation: 'Remove User from Workspace',
      data: { user },
    });
    return { success: true, workspace_gid: workspace, user };
  },
});
