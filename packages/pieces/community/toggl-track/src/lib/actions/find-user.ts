import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const findUser = createAction({
  auth: togglTrackAuth,
  name: 'find_user',
  displayName: 'Find User',
  description: 'Locate a user in a workspace.',
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
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(context) {
    const { workspaceId, email } = context.propsValue;
    const users = await togglTrackApi.getWorkspaceUsers(
      context.auth as string,
      parseInt(workspaceId as string)
    );
    return users.find((user) => user.email === email);
  },
});
