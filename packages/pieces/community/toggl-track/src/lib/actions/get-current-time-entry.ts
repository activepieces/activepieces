import { createAction } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglTimeEntries } from '../common/time-entries';
import { togglOutputSchemas } from '../output-schemas';

export const getCurrentTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'get_current_time_entry',
  classification: 'READ',
  displayName: 'Get Current Time Entry',
  description: 'Get the time entry that is running right now, if any.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the running time entry with running = true, or { running: false } when no timer runs. On Toggl 2.0 only the given workspace is checked. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.optional_workspace_id,
  },
  outputSchema: togglOutputSchemas.currentTimeEntry,
  async run(context) {
    const auth = context.auth;
    const workspaceId = togglApi.optionalId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const targetWorkspaceId =
        workspaceId ?? (await togglApi.twoSettings(auth)).current_workspace_id;
      const running = await togglTimeEntries.twoCurrent({
        auth,
        workspaceId: targetWorkspaceId,
      });
      return running ? { running: true, ...running } : { running: false };
    }

    const running = await togglApi.request<
      ({ id: number; workspace_id?: number } & Record<string, unknown>) | null
    >({
      auth,
      method: togglApi.HttpMethod.GET,
      path: '/me/time_entries/current',
    });
    if (
      !running ||
      typeof running.id !== 'number' ||
      (workspaceId && running.workspace_id !== workspaceId)
    ) {
      return { running: false };
    }
    return { running: true, ...running };
  },
});
