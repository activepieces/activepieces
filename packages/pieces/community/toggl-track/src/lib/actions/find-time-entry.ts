import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const findTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'find_time_entry',
  displayName: 'Find Time Entry',
  description: 'Finds a time entry by description.',
  props: {
    workspaceId: Property.Dropdown({
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
                        value: workspace.id.toString(),
                    };
                }),
            };
        },
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: true,
    }),
  },
  async run(context) {
    const { workspaceId, description } = context.propsValue;
    const timeEntries = await togglTrackApi.getTimeEntries(
      context.auth as string,
      parseInt(workspaceId as string)
    );
    return timeEntries.find((entry) => entry.description === description);
  },
});
