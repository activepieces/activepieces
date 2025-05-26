import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchWorkspaces, fetchProjects } from '../common';
import { clockifyAuth } from '../../index';

export const findTaskAction = createAction({
  auth: clockifyAuth,
  name: 'find_task',
  displayName: 'Find Task',
  description: 'Find a task by name in a project',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Clockify account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const workspaces = await fetchWorkspaces(apiKey);

        return {
          options: workspaces.map((workspace: any) => ({
            label: workspace.name,
            value: workspace.id,
          })),
        };
      },
    }),
    projectId: Property.Dropdown({
      displayName: 'Project',
      required: true,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            placeholder: 'Please select a workspace first',
            options: [],
          };
        }

        const apiKey = auth as string;
        const projects = await fetchProjects(apiKey, workspaceId as string);

        return {
          options: projects.map((project: any) => ({
            label: project.name,
            value: project.id,
          })),
        };
      },
    }),
    taskName: Property.ShortText({
      displayName: 'Task Name',
      required: true
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, projectId, taskName } = context.propsValue;

    const tasks = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/projects/${projectId}/tasks`
    ) as Array<{
      id: string;
      name: string;
      projectId: string;
      assigneeIds?: string[];
      status?: string;
    }>;

    return tasks.find((task) => task.name === taskName) || null;
  },
});
