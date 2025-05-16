import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const findRunningTimerAction = createAction({
  auth: clockifyAuth,
  name: 'find_running_timer',
  displayName: 'Find Running Timer',
  description: 'Check if a timer is currently running in the workspace',
  props: {
    workspaceId: Property.ShortText({ displayName: 'Workspace ID', required: true }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId } = context.propsValue;

    const runningTimers = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/time-entries/status/in-progress`
    );

    return runningTimers || null;
  },
});
