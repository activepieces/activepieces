import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiHelpers } from '../common/ai-helpers';
import { listWorkspacesOutputSchema } from '../output-schemas';

export const listWorkspacesAction = createAction({
  name: 'baserow_list_workspaces',
  classification: 'SEARCH',
  outputSchema: listWorkspacesOutputSchema,
  displayName: 'List Workspaces',
  description: 'Lists the workspaces the user belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Baserow workspaces the connected user belongs to, with ID, name and the user\'s permission level. Use to get the Workspace ID for Create Database, List Workspace Users or Search Workspace. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {},
  async run(context) {
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'List Workspaces' });
    const client = await makeClient(context.auth);
    const workspaces = await baserowAiHelpers.execute(() => client.listWorkspaces());
    return {
      count: workspaces.length,
      workspaces: workspaces.map((workspace) => ({
        id: workspace['id'],
        name: workspace['name'],
        permissions: workspace['permissions'],
      })),
    };
  },
});
