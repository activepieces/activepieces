import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglApi } from '../common/client';
import { togglModels } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const listWorkspaces = createAction({
  auth: togglTrackAuth,
  name: 'list_workspaces',
  classification: 'SEARCH',
  displayName: 'List Workspaces',
  description: 'List the workspaces you belong to.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the workspaces the connection can reach (id, name, organization ID). On Toggl 2.0 the other fields are null. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: togglOutputSchemas.workspaceList,
  async run(context) {
    const auth = context.auth;
    if (togglApi.isTwo(auth)) {
      const workspaces = await togglApi.twoWorkspaces(auth);
      const organizationId = togglApi.twoOrganizationId(auth);
      return workspaces.map((workspace) =>
        togglModels.twoWorkspace({
          id: workspace.id,
          name: workspace.name,
          organizationId,
          currency: null,
        })
      );
    }
    const workspaces = await togglApi.request<Record<string, unknown>[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: '/me/workspaces',
    });
    return (workspaces ?? []).map(togglModels.classicWorkspace);
  },
});
