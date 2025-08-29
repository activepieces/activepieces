import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const createProject = createAction({
  auth: togglTrackAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project.',
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
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
  },
  async run(context) {
    const { workspace_id, name } = context.propsValue;
    return await togglTrackApi.createProject(
      context.auth as string,
      workspace_id as number,
      name as string
    );
  },
});
