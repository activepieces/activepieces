import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

type ClockifyTimeEntry = {
  id: string;
  description: string;
  timeInterval: {
    start: string;
    end?: string;
    duration?: string;
  };
  projectId?: string;
  taskId?: string;
  billable?: boolean;
  userId?: string;
};

export const findTimeEntryAction = createAction({
  auth: clockifyAuth,
  name: 'find_time_entry',
  displayName: 'Find Time Entry',
  description: 'Find a time entry by description',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, description } = context.propsValue;

    if (!/^[a-f\d]{24}$/i.test(workspaceId)) {
      throw new Error(
        'Invalid Workspace ID: must be a 24-character hex string'
      );
    }

    const user = await makeRequest(apiKey, HttpMethod.GET, `/user`);
    const userId = user.id;

    const entries: ClockifyTimeEntry[] = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/user/${userId}/time-entries`
    );

    return entries.find((entry) => entry.description === description) || null;
  },
});
