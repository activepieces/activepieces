import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTimeEntry } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const getTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'get_time_entry',
  classification: 'READ',
  displayName: 'Get Time Entry',
  description: 'Get a time entry by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one time entry by ID. A running entry has duration -1 and no stop. Fails clearly when it does not exist. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.optional_workspace_id,
    time_entry_id: Property.ShortText({
      displayName: 'Time Entry ID',
      description: 'The ID of the time entry (from Find Time Entry or a trigger).',
      required: true,
    }),
  },
  outputSchema: togglOutputSchemas.timeEntry,
  async run(context) {
    const auth = context.auth;
    const timeEntryId = togglApi.requireId({
      value: context.propsValue.time_entry_id,
      label: 'Time Entry ID',
    });
    const workspaceId = togglApi.optionalId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    return togglApi.withNotFound({
      label: `Time entry ${timeEntryId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          const targetWorkspaceId =
            workspaceId ??
            (await togglApi.twoSettings(auth)).current_workspace_id;
          const entry = await togglApi.request<TwoTimeEntry>({
            auth,
            method: togglApi.HttpMethod.GET,
            path: togglApi.twoWorkspacePath({
              auth,
              workspaceId: targetWorkspaceId,
              path: `/time-entries/${timeEntryId}`,
            }),
          });
          return togglModels.timeEntry({ item: entry, running: false });
        }
        const entry = await togglApi.request<{ workspace_id?: number } & Record<string, unknown>>({
          auth,
          method: togglApi.HttpMethod.GET,
          path: `/me/time_entries/${timeEntryId}`,
        });
        if (!entry) {
          throw new Error(`Time entry ${timeEntryId} was not found.`);
        }
        if (workspaceId && entry.workspace_id !== workspaceId) {
          throw new Error(
            `Time entry ${timeEntryId} belongs to another workspace.`
          );
        }
        return entry;
      },
    });
  },
});
