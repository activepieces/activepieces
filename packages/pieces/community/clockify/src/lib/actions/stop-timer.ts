import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const stopTimer = createAction({
  auth: clockifyAuth,
  name: 'stop_timer',
  displayName: 'Stop Timer',
  description: 'Stop the currently running timer in Clockify',
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
  },
  async run({ propsValue, auth }) {
    // First, get the current running timer
    const userTimeEntries = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/workspaces/${propsValue.workspaceId}/user/${propsValue.userId}/time-entries?in-progress=true`
    );

    if (!userTimeEntries || !userTimeEntries.length) {
      return {
        success: false,
        message: 'No running timer found',
      };
    }

    const runningTimer = userTimeEntries[0];

    // Stop the running timer
    const response = await makeRequest(
      auth as string,
      HttpMethod.PATCH,
      `/workspaces/${propsValue.workspaceId}/user/${propsValue.userId}/time-entries/${runningTimer.id}`,
      {
        end: new Date().toISOString(),
      }
    );

    return response;
  },
});
