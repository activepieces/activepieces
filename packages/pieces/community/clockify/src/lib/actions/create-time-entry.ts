import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const createTimeEntry = createAction({
  auth: clockifyAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Create a new time entry in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project',
      required: false,
    }),
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the time entry',
      required: false,
    }),
    start: Property.DateTime({
      displayName: 'Start Time',
      description: 'The start time of the time entry',
      required: true,
    }),
    end: Property.DateTime({
      displayName: 'End Time',
      description: 'The end time of the time entry',
      required: true,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the time entry is billable',
      required: false,
      defaultValue: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags for the time entry',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/workspaces/${propsValue.workspaceId}/user/${propsValue.userId}/time-entries`,
      {
        start: propsValue.start,
        end: propsValue.end,
        description: propsValue.description,
        projectId: propsValue.projectId,
        taskId: propsValue.taskId,
        billable: propsValue.billable,
        tagIds: propsValue.tags,
      }
    );

    return response;
  },
});
