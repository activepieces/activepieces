import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTask } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const createTask = createAction({
  auth: togglTrackAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a new task under a project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a task under a project. Needs the workspace, project, and a name; external reference and the Active flag are Classic only. Returns the new task. A retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    project_id: togglCommon.project_id,
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the new task.',
      required: true,
    }),
    estimated_seconds: Property.Number({
      displayName: 'Estimated Seconds',
      description:
        'Estimated time in seconds. Toggl 2.0 stores whole minutes.',
      required: false,
    }),
    external_reference: Property.ShortText({
      displayName: 'External Reference',
      description:
        'External system reference. Toggl Track (Classic) only.',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description:
        'Uncheck to mark the task done. Toggl Track (Classic) only.',
      required: false,
      defaultValue: true,
    }),
    user_id: Property.Number({
      displayName: 'Creator User ID',
      description:
        'Creator user ID, defaults to yours. Toggl 2.0 assigns them the task.',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.task,
  async run(context) {
    const { name, estimated_seconds, external_reference, active } =
      context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const projectId = togglApi.requireId({
      value: context.propsValue.project_id,
      label: 'Project',
    });
    const userId = togglApi.optionalId({
      value: context.propsValue.user_id,
      label: 'Creator User ID',
    });

    if (togglApi.isTwo(auth)) {
      const created = await togglApi.request<TwoTask>({
        auth,
        method: togglApi.HttpMethod.POST,
        path: togglApi.twoWorkspacePath({ auth, workspaceId, path: '/tasks' }),
        body: {
          name,
          project_id: projectId,
          ...(isNil(estimated_seconds)
            ? {}
            : { estimated_mins: Math.round(estimated_seconds / 60) }),
          ...(isNil(userId) ? {} : { assignee_user_ids: [userId] }),
        },
      });
      return togglModels.task(created);
    }

    return togglApi.request<Record<string, unknown>>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      body: {
        name,
        active,
        ...(isNil(estimated_seconds) ? {} : { estimated_seconds }),
        ...(external_reference ? { external_reference } : {}),
        ...(isNil(userId) ? {} : { user_id: userId }),
      },
    });
  },
});
