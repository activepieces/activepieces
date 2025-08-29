import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const createTask = createAction({
  auth: togglTrackAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task under a project.',
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
              value: workspace.id.toString(),
            };
          }),
        };
      },
    }),
    project_id: Property.Dropdown({
      displayName: 'Project',
      required: true,
      refreshers: ['workspace_id'],
      options: async ({ auth, workspace_id }) => {
        if (!auth || !workspace_id) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a workspace first',
          };
        }
        const projects = await togglTrackApi.getProjects(
          auth as string,
          workspace_id as number
        );
        return {
          disabled: false,
          options: projects.map((project) => {
            return {
              label: project.name,
              value: project.id.toString(),
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
    const { workspace_id, project_id, name } = context.propsValue;
    return await togglTrackApi.createTask(
      context.auth as string,
      workspace_id as number,
      project_id as number,
      name as string
    );
  },
});
