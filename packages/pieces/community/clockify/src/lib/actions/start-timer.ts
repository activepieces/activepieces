import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchWorkspaces } from '../common';
import { clockifyAuth } from '../../index';

export const startTimerAction = createAction({
  auth: clockifyAuth,
  name: 'start_timer',
  displayName: 'Start Timer',
  description: 'Begin a timer in Clockify at the start of a scheduled meeting.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Clockify account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const workspaces = await fetchWorkspaces(apiKey);

        return {
          options: workspaces.map((workspace: any) => ({
            label: workspace.name,
            value: workspace.id,
          })),
        };
      },
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
