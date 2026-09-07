import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';
import { listWorkspaceUsersActionOutputSchema } from '../output-schemas';

export const moxieListWorkspaceUsersAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_workspace_users',
  classification: 'READ',
  displayName: 'List Workspace Users',
  description: 'Retrieve the users of the workspace and their access.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the users in the Moxie workspace with their user type, contact details and project and feature access. Use to resolve the email address of an assignee before creating a task. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listWorkspaceUsersActionOutputSchema,
  props: {},
  async run({ auth }) {
    const client = await makeClient(auth);
    return await client.listWorkspaceUsers();
  },
});
