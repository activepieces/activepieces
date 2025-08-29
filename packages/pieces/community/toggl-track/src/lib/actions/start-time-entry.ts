import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const startTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'start_time_entry',
  displayName: 'Start Time Entry',
  description: 'Start a live time entry.',
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
    description: Property.LongText({
      displayName: 'Description',
      required: true,
    }),
    project_id: Property.Dropdown({
      displayName: 'Project',
      required: false,
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
  },
  async run(context) {
    const { workspace_id, description, project_id } = context.propsValue;
    const timeEntry = {
      description,
      start: new Date().toISOString(),
      duration: -1,
      project_id,
      workspace_id,
      created_with: 'Activepieces',
    };
    return await togglTrackApi.startTimeEntry(
      context.auth as string,
      workspace_id as number,
      timeEntry
    );
  },
});
