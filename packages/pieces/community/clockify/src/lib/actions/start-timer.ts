import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const startTimer = createAction({
  auth: clockifyAuth,
  name: 'start_timer',
  displayName: 'Start Timer',
  description: 'Start a timer in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the time entry',
      required: false,
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
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the time entry is billable',
      required: false,
      defaultValue: false,
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'The IDs of the tags for the time entry',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/workspaces/${propsValue.workspaceId}/time-entries`,
      {
        start: new Date().toISOString(),
        description: propsValue.description,
        projectId: propsValue.projectId,
        taskId: propsValue.taskId,
        billable: propsValue.billable,
        tagIds: propsValue.tagIds,
      }
    );

    return response;
  },
});
