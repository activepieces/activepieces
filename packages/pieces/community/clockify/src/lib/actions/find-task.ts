import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

interface Task {
  id: string;
  name: string;
  status: string;
  [key: string]: any;
}

export const findTask = createAction({
  auth: clockifyAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Find a task in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project',
      required: true,
    }),
    taskName: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task to search for',
      required: false,
    }),
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to find',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the task',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Done', value: 'DONE' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const path = `/workspaces/${propsValue.workspaceId}/projects/${propsValue.projectId}/tasks`;

    // If task ID is provided, directly get that task
    if (propsValue.taskId) {
      const task = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `${path}/${propsValue.taskId}`
      );
      return task;
    }

    // Otherwise, get all tasks and filter
    const tasks = await makeRequest(
      auth as string,
      HttpMethod.GET,
      path
    ) as Task[];

    let filteredTasks = tasks;

    // Filter by name if provided
    if (propsValue.taskName) {
      filteredTasks = filteredTasks.filter((task: Task) =>
        task.name.toLowerCase().includes(propsValue.taskName?.toLowerCase() || '')
      );
    }

    // Filter by status if provided
    if (propsValue.status) {
      filteredTasks = filteredTasks.filter((task: Task) =>
        task.status === propsValue.status
      );
    }

    return filteredTasks;
  },
});
