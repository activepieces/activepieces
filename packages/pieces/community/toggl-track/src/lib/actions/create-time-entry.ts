import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';

export const createTimeEntry = createAction({
  auth: togglTrackAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Manually create a time entry.',
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
    start_time: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
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
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
  },
  async run(context) {
    const { workspaceId, description, start_time, duration, projectId, tags } = context.propsValue;
    const timeEntry = {
      description,
      start: start_time,
      duration,
      project_id: projectId ? parseInt(projectId as string) : undefined,
      tags: tags as string[],
      workspace_id: parseInt(workspaceId as string),
      created_with: 'Activepieces',
    };
    return await togglTrackApi.createTimeEntry(
      context.auth as string,
      parseInt(workspaceId as string),
      timeEntry
    );
  },
});
