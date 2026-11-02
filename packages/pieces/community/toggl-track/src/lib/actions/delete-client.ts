import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const deleteClient = createAction({
  auth: togglTrackAuth,
  name: 'delete_client',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Client',
  description: 'Permanently delete a client from a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a client by ID. Returns { success, id }; a second call fails because it is already gone. Cannot be undone.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    client_id: togglCommon.required_client_id,
  },
  outputSchema: togglOutputSchemas.deleted,
  async run(context) {
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const clientId = togglApi.requireId({
      value: context.propsValue.client_id,
      label: 'Client',
    });
    await togglApi.withNotFound({
      label: `Client ${clientId}`,
      run: () =>
        togglApi.request<unknown>({
          auth: context.auth,
          method: togglApi.HttpMethod.DELETE,
          path: `/workspaces/${workspaceId}/clients/${clientId}`,
        }),
    });
    return { success: true, id: clientId };
  },
});
