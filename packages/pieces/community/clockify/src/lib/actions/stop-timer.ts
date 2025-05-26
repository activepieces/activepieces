import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchWorkspaces, fetchUsers } from '../common';
import { clockifyAuth } from '../../index';

export const stopTimerAction = createAction({
  auth: clockifyAuth,
  name: 'stop_timer',
  displayName: 'Stop Timer',
  description: 'Stop the currently running timer',
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
    userId: Property.Dropdown({
      displayName: 'User',
      required: true,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            placeholder: 'Please select a workspace first',
            options: [],
          };
        }

        const apiKey = auth as string;
        const users = await fetchUsers(apiKey, workspaceId as string);

        return {
          options: users.map((user: any) => ({
            label: user.name || user.email,
            value: user.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, userId } = context.propsValue;

    const entries = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/user/${userId}/time-entries?in-progress=true`
    );

    const currentEntry = Array.isArray(entries) ? entries[0] : null;

    if (!currentEntry || !currentEntry.id) {
      throw new Error('No running timer found for the user.');
    }

    const payload = {
      description: currentEntry.description || '',
      tagIds: currentEntry.tagIds || [],
      billable: currentEntry.billable ?? true,
      start: currentEntry.timeInterval.start,
      end: new Date().toISOString(),
      projectId: currentEntry.projectId,
      taskId: currentEntry.taskId,
    };

    return await makeRequest(
      apiKey,
      HttpMethod.PUT,
      `/workspaces/${workspaceId}/time-entries/${currentEntry.id}`,
      payload
    );
  },
});
