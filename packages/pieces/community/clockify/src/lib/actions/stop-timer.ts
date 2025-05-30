import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { workspaceIdDropdown, userIdDropdown } from '../common/props';
import { clockifyAuth } from '../../index';

export const stopTimerAction = createAction({
  auth: clockifyAuth,
  name: 'stop_timer',
  displayName: 'Stop Timer',
  description: 'Stop the currently running timer',
  props: {
    workspaceId: workspaceIdDropdown,
    userId: userIdDropdown,
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
