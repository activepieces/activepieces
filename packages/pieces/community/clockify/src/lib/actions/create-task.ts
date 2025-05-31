import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';
import { clockifyCommon } from '../common/props';

export const createTask = createAction({
  auth: clockifyAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Clockify',
  props: {
    workspaceId: clockifyCommon.workspace_id(),
    projectId: clockifyCommon.project_id(),
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'The name of the task',
      required: true,
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
        status: propsValue.status,
      }
    );

    return response;
  },
});
