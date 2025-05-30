import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { workspaceIdDropdown, projectIdDropdown } from '../common/props';
import { clockifyAuth } from '../../index';

export const findTaskAction = createAction({
  auth: clockifyAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Find a task by name in a project',
  props: {
    workspaceId: workspaceIdDropdown,
    projectId: projectIdDropdown,
    taskName: Property.ShortText({
      displayName: 'Task Name',
      required: true
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, projectId, taskName } = context.propsValue;

    const tasks = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/projects/${projectId}/tasks`
    ) as Array<{
      id: string;
      name: string;
      projectId: string;
      assigneeIds?: string[];
      status?: string;
    }>;

    return tasks.find((task) => task.name === taskName) || null;
  },
});
