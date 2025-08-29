import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const stopTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'stop_time_entry',
  displayName: 'Stop Time Entry',
  description: 'Stops the running time entry.',
  props: {
    workspace_id: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        const workspaces = await togglTrackApi.getWorkspaces(auth as string);
        return {
          disabled: false,
          options: workspaces.map((workspace) => {
            return {
              label: workspace.name,
              value: workspace.id,
            };
          }),
        };
      },
    }),
  },
  async run(context) {
    const runningTimeEntry = await togglTrackApi.getRunningTimeEntry(
      context.auth as string
    );
    if (!runningTimeEntry) {
      throw new Error('No time entry is running.');
    }
    return await togglTrackApi.stopTimeEntry(
      context.auth as string,
      runningTimeEntry.workspace_id,
      runningTimeEntry.id
    );
  },
});
