import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

type ClockifyTimeEntry = {
  id: string;
  description: string;
  tagIds?: string[];
  userId: string;
  billable?: boolean;
  taskId?: string;
  projectId?: string;
  timeInterval: {
    start: string;
    end?: string;
    duration?: string;
  };
  workspaceId: string;
};

type ClockifyUpdateTimeEntry = {
  id: string;
  description: string;
  tagIds?: string[];
  billable?: boolean;
  start: string;
  end: string;
  projectId?: string;
  taskId?: string;
};

export const stopTimerAction = createAction({
  auth: clockifyAuth,
  name: 'stop_timer',
  displayName: 'Stop Timer',
  description: 'Stop the currently running timer',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      required: true,
    }),
    userId: Property.ShortText({ displayName: 'User ID', required: true }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, userId } = context.propsValue;

    const entries: ClockifyTimeEntry[] = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/user/${userId}/time-entries?in-progress=true`
    );

    const currentEntry = Array.isArray(entries) ? entries[0] : null;

    if (!currentEntry || !currentEntry.id) {
      throw new Error('No running timer found for the user.');
    }

    const payload: ClockifyUpdateTimeEntry = {
      id: currentEntry.id,
      description: currentEntry.description || '',
      tagIds: currentEntry.tagIds || [],
      billable: currentEntry.billable ?? true,
      start: currentEntry.timeInterval.start,
      end: new Date().toISOString(),
    };

    if (currentEntry.projectId) {
      payload.projectId = currentEntry.projectId;
    }

    if (currentEntry.taskId) {
      payload.taskId = currentEntry.taskId;
    }

    return await makeRequest(
      apiKey,
      HttpMethod.PUT,
      `/workspaces/${workspaceId}/user/${userId}/time-entries`,
      [payload]
    );
  },
});
