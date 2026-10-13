import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { deleteWorkspaceActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { makeClient } from '../../../common';

export const deleteWorkspaceAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_workspace',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Workspace',
  description: 'Deletes a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a monday.com workspace. Destructive: the workspace and the boards, docs and folders inside it are removed for everyone, so only use when the user explicitly asks to delete this workspace. To remove a single board prefer Archive Board. A retry after success fails because the workspace is gone.',
    idempotent: false,
  },
  outputSchema: deleteWorkspaceActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
  },
  async run(context) {
    const data = await makeClient(context.auth).query<{ delete_workspace: { id: string; name: string | null } }>({
      query: `mutation ($workspace_id: ID!) {
        delete_workspace(workspace_id: $workspace_id) { id name }
      }`,
      variables: { workspace_id: context.propsValue.workspace_id },
    });

    return {
      id: data.delete_workspace.id,
      name: data.delete_workspace.name ?? null,
      deleted: true,
    };
  },
});
