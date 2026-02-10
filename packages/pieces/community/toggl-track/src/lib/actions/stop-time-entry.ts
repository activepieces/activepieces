import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpError } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const stopTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'stop_time_entry',
  displayName: 'Stop Time Entry',
  description: 'Stops the currently running time entry.',
  props: {
    workspace_id: togglCommon.workspace_id,
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    const apiToken = context.auth;
    let runningEntryId: number;

    try {
      const runningEntryResponse = await httpClient.sendRequest<{ id: number }>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/me/time_entries/current`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
            'base64'
          )}`,
        },
      });
      runningEntryId = runningEntryResponse.body.id;
    } catch (e) {
     
      if (e instanceof HttpError && e.response.status === 404) {
        return { success: false, message: "No time entry is currently running." };
      }
      
      throw e;
    }

    
    const stopResponse = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/time_entries/${runningEntryId}/stop`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
    });

    return stopResponse.body;
  },
});