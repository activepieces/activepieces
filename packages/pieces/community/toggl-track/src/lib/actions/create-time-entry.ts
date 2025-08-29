import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const createTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Manually create a time entry.',
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
    description: Property.LongText({
      displayName: 'Description',
      required: true,
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
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
              value: project.id,
            };
          }),
        };
      },
    }),
  },
  async run(context) {
    const { workspace_id, description, start_time, duration, project_id } = context.propsValue;
    const timeEntry = {
      description,
      start: start_time,
      duration,
      project_id,
      workspace_id,
      created_with: 'Activepieces',
    };
    return await togglTrackApi.createTimeEntry(
      context.auth as string,
      workspace_id as number,
      timeEntry
    );
  },
});
