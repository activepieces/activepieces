import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaUserOutputSchema } from '../../output-schemas';

export const asanaAddUserToWorkspaceAction = createAction({
  auth: asanaAuth,
  name: 'add_user_to_workspace',
  classification: 'WRITE',
  displayName: 'Add User to Workspace',
  description: 'Invite or add a user to an Asana workspace or organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a user to a workspace or organization by email or gid and returns the user record. Only workspace admins can do this. An email that has no Asana account receives an invitation, and a new member may take a paid seat on paid plans, so confirm with the user first. Adding someone who is already a member leaves them in place.',
    idempotent: true,
  },
  outputSchema: asanaUserOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace or organization. Obtain it from List Workspaces.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User',
      description: 'User to add: an email address or a user gid.',
      required: true,
    }),
  },
  async run(context) {
    const { workspace, user } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/workspaces/${asanaUtils.pathSegment(workspace)}/addUser`,
      operation: 'Add User to Workspace',
      query: { opt_fields: 'name,email' },
      data: { user: user.trim() },
    });
  },
});
