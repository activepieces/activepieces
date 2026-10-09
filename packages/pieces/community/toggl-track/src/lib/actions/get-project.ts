import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoProject } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const getProject = createAction({
  auth: togglTrackAuth,
  name: 'get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Get a project by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one project by ID with status, flags, estimate, and tracked time. Fails clearly when it does not exist. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    project_id: togglCommon.project_id,
  },
  outputSchema: togglOutputSchemas.project,
  async run(context) {
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const projectId = togglApi.requireId({
      value: context.propsValue.project_id,
      label: 'Project',
    });
    return togglApi.withNotFound({
      label: `Project ${projectId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          const project = await togglApi.request<TwoProject>({
            auth,
            method: togglApi.HttpMethod.GET,
            path: togglApi.twoWorkspacePath({
              auth,
              workspaceId,
              path: `/projects/${projectId}`,
            }),
          });
          return togglModels.project(project);
        }
        return togglApi.request<Record<string, unknown>>({
          auth,
          method: togglApi.HttpMethod.GET,
          path: `/workspaces/${workspaceId}/projects/${projectId}`,
        });
      },
    });
  },
});
