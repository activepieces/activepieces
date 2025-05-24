import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const startTimerAction = createAction({
  auth: clockifyAuth,
  name: 'start_timer',
  displayName: 'Start Timer',
  description: 'Begin a timer in Clockify at the start of a scheduled meeting.',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      required: true
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      required: false
    }),
    taskId: Property.ShortText({
      displayName: 'Task ID',
      required: false
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      required: true,
      defaultValue: false
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'The IDs of the tags for the time entry',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'REGULAR' },
          { label: 'Break', value: 'BREAK' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, projectId, taskId, description, billable, tagIds, type } = context.propsValue;

    const body = {
      start: new Date().toISOString(),
      description,
      billable,
      projectId,
      taskId,
      tagIds,
      type: type ?? 'REGULAR',
    };

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/time-entries`,
      body
    );
  },
});
