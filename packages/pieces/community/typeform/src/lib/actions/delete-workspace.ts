import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { deleteWorkspaceOutputSchema } from '../output-schemas';

export const deleteWorkspaceAction = createAction({
  auth: typeformAuth,
  name: 'delete_workspace',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Workspace',
  description: 'Deletes an empty workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete an empty Typeform workspace. Typeform would delete every form in a workspace and all their responses along with it, so this action refuses workspaces that still contain forms; move them with Update Form or delete them first. The default workspace cannot be deleted. Cannot be undone; confirm with the user first.',
    idempotent: false,
  },
  outputSchema: deleteWorkspaceOutputSchema,
  props: {
    workspace: typeformCommon.requiredWorkspaceId,
  },
  async run({ auth, propsValue }) {
    const path = `/workspaces/${encodeURIComponent(propsValue.workspace)}`;
    const current = await typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path,
    });
    if (current['default'] === true) {
      throw new Error('The default workspace cannot be deleted.');
    }
    const forms = current['forms'];
    const formCount = typeformCommon.isRecord(forms) && typeof forms['count'] === 'number' ? forms['count'] : 0;
    if (formCount > 0) {
      throw new Error(
        `This workspace still contains ${formCount} form(s), and deleting it would delete them and all their responses. Move them to another workspace with Update Form, or delete them first.`
      );
    }
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.DELETE,
      path,
    });
    return { deleted: true, workspace_id: propsValue.workspace };
  },
});
