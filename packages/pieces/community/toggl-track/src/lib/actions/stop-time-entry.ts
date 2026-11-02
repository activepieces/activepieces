import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglTimeEntries } from '../common/time-entries';
import { togglOutputSchemas } from '../output-schemas';

export const stopTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'stop_time_entry',
  classification: 'WRITE',
  displayName: 'Stop Time Entry',
  description: 'Stops the currently running time entry.',
  audience: 'both',
  aiMetadata: {
    description:
      'Stops the current user\'s running time entry and returns the stopped entry, or { success: false, message } when nothing is running. On Toggl 2.0 only the given workspace is checked. Safe to retry once stopped.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
  },
  outputSchema: togglOutputSchemas.stoppedTimeEntry,
  async run(context) {
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const running = await togglTimeEntries.twoCurrent({ auth, workspaceId });
      if (!running) {
        return NOT_RUNNING;
      }
      return togglTimeEntries.twoStop({ auth, workspaceId });
    }

    const running = await togglApi.request<{
      id: number;
      workspace_id?: number;
    } | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: '/me/time_entries/current',
    }).catch((error: unknown) => {
      if (togglApi.httpStatusOf(error) === 404) {
        return null;
      }
      throw error;
    });
    if (!running || typeof running.id !== 'number') {
      return NOT_RUNNING;
    }

    return togglApi.request<Record<string, unknown>>({
      auth,
      method: togglApi.HttpMethod.PATCH,
      path: `/workspaces/${running.workspace_id ?? workspaceId}/time_entries/${running.id}/stop`,
    });
  },
});

const NOT_RUNNING = {
  success: false,
  message: 'No time entry is currently running.',
};
