import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const startTimerAction = createAction({
  auth: clockifyAuth,
  name: 'start_timer',
  displayName: 'Start Timer',
  description: 'Start a timer in Clockify',
  props: {
    workspaceId: Property.ShortText({ displayName: 'Workspace ID', required: true }),
    projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, projectId, description } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/time-entries`,
      {
        start: new Date().toISOString(),
        description,
        projectId,
      }
    );
  },
});
