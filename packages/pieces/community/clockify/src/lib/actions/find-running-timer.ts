import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';
import { clockifyCommon } from '../common/props';

export const findRunningTimer = createAction({
  auth: clockifyAuth,
  name: 'find_running_timer',
  displayName: 'Find Running Timer',
  description: 'Find the currently running timer in Clockify',
  props: {
    workspaceId: clockifyCommon.workspace_id(),
    userId: clockifyCommon.user_id(),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/workspaces/${propsValue.workspaceId}/user/${propsValue.userId}/time-entries?in-progress=true`
    );

    if (!response || !response.length) {
      return {
        success: false,
        message: 'No running timer found',
        runningTimer: null
      };
    }

    return {
      success: true,
      runningTimer: response[0]
    };
  },
});
