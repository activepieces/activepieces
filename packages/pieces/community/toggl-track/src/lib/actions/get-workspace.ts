import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const getWorkspace = createAction({
  auth: togglTrackAuth,
  name: 'get_workspace',
  classification: 'READ',
  displayName: 'Get Workspace',
  description: 'Get the details of a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one workspace by ID. On Toggl 2.0 only id, name, organization ID, and currency are filled. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
  },
  outputSchema: togglOutputSchemas.workspace,
  async run(context) {
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    return togglApi.withNotFound({
      label: `Workspace ${workspaceId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          const [workspaces, currency] = await Promise.all([
            togglApi.twoWorkspaces(auth),
            togglApi.request<{ currency?: string } | null>({
              auth,
              method: togglApi.HttpMethod.GET,
              path: `/workspaces/${workspaceId}/currency`,
            }),
          ]);
          const match = workspaces.find((workspace) => workspace.id === workspaceId);
          return togglModels.twoWorkspace({
            id: workspaceId,
            name: match?.name ?? null,
            organizationId: togglApi.twoOrganizationId(auth),
            currency: currency?.currency ?? null,
          });
        }
        const workspace = await togglApi.request<Record<string, unknown>>({
          auth,
          method: togglApi.HttpMethod.GET,
          path: `/workspaces/${workspaceId}`,
        });
        return togglModels.classicWorkspace(workspace);
      },
    });
  },
});
