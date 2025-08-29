import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const findTag = createAction({
  auth: togglTrackAuth,
  name: 'find_tag',
  displayName: 'Find Tag',
  description: 'Find a tag by name.',
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
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
  },
  async run(context) {
    const { workspaceId, name } = context.propsValue;
    const tags = await togglTrackApi.getTags(
      context.auth as string,
      parseInt(workspaceId as string)
    );
    return tags.find((tag) => tag.name === name);
  },
});
