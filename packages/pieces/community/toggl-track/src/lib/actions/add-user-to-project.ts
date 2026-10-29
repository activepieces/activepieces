import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const addUserToProject = createAction({
  auth: togglTrackAuth,
  name: 'add_user_to_project',
  classification: 'WRITE',
  displayName: 'Add User to Project',
  description: 'Add a workspace member to a project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a workspace member to a project by user ID, optionally as manager. Classic only. Returns the project membership; fails if they are already a member.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    project_id: togglCommon.project_id,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The user_id of the member (from Find User).',
      required: true,
    }),
    manager: Property.Checkbox({
      displayName: 'Project Manager',
      description: 'Make the user a manager of the project.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: togglOutputSchemas.projectUser,
  async run(context) {
    const auth = context.auth;
    if (togglApi.isTwo(auth)) {
      throw new Error(
        'Add User to Project is only available for Toggl Track (Classic) connections. On Toggl 2.0, add project members in the Toggl app.'
      );
    }
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const projectId = togglApi.requireId({
      value: context.propsValue.project_id,
      label: 'Project',
    });
    const userId = togglApi.requireId({
      value: context.propsValue.user_id,
      label: 'User ID',
    });
    return togglApi.request<Record<string, unknown>>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/workspaces/${workspaceId}/project_users`,
      body: {
        project_id: projectId,
        user_id: userId,
        manager: context.propsValue.manager ?? false,
      },
    });
  },
});
