import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const createTask = createAction({
  auth: clockifyAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace where the task will be created',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project where the task will be created',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task',
      required: true,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      description: 'The IDs of the users to assign to the task',
      required: false,
    }),
    estimate: Property.ShortText({
      displayName: 'Estimate (seconds)',
      description: 'The estimated time for the task in seconds',
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
    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/workspaces/${propsValue.workspaceId}/projects/${propsValue.projectId}/tasks`,
      {
        name: propsValue.name,
        assigneeIds: propsValue.assigneeIds,
        estimate: propsValue.estimate,
        status: propsValue.status,
      }
    );

    return response;
  },
});
