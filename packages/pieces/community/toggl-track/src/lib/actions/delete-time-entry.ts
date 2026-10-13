import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const deleteTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'delete_time_entry',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Time Entry',
  description: 'Delete a time entry.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a time entry by ID. Returns { success, id }; a second call fails because it is already gone. Cannot be undone from Activepieces.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    time_entry_id: Property.ShortText({
      displayName: 'Time Entry ID',
      description: 'The ID of the time entry to delete.',
      required: true,
    }),
  },
  outputSchema: togglOutputSchemas.deleted,
  async run(context) {
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const timeEntryId = togglApi.requireId({
      value: context.propsValue.time_entry_id,
      label: 'Time Entry ID',
    });
    await togglApi.withNotFound({
      label: `Time entry ${timeEntryId}`,
      run: () =>
        togglApi.request<unknown>({
          auth,
          method: togglApi.HttpMethod.DELETE,
          path: togglApi.isTwo(auth)
            ? togglApi.twoWorkspacePath({
                auth,
                workspaceId,
                path: `/time-entries/${timeEntryId}`,
              })
            : `/workspaces/${workspaceId}/time_entries/${timeEntryId}`,
        }),
    });
    return { success: true, id: timeEntryId };
  },
});
