import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const startTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'start_time_entry',
  displayName: 'Start Time Entry',
  description: 'Start a live time entry.',
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
    description: Property.LongText({
      displayName: 'Description',
      required: true,
    }),
    projectId: Property.Dropdown({
      displayName: 'Project',
      required: false,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a workspace first',
          };
        }
        const projects = await togglTrackApi.getProjects(
          auth as string,
          parseInt(workspaceId as string)
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
    const { workspaceId, description, projectId } = context.propsValue;
    const timeEntry = {
      description,
      start: new Date().toISOString(),
      duration: -1,
      project_id: projectId ? parseInt(projectId as string) : undefined,
      workspace_id: parseInt(workspaceId as string),
      created_with: 'Activepieces',
    };
    return await togglTrackApi.startTimeEntry(
      context.auth as string,
      parseInt(workspaceId as string),
      timeEntry
    );
  },
});
