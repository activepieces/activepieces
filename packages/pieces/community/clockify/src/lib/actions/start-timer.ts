import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchWorkspaces, fetchProjects, fetchTasks } from '../common';
import { clockifyAuth } from '../../index';

export const startTimerAction = createAction({
  auth: clockifyAuth,
  name: 'start_timer',
  displayName: 'Start Timer',
  description: 'Begin a timer in Clockify at the start of a scheduled meeting.',
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
      required: false,
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
    taskId: Property.Dropdown({
      displayName: 'Task',
      required: false,
      refreshers: ['workspaceId', 'projectId'],
      options: async ({ auth, workspaceId, projectId }) => {
        if (!auth || !workspaceId || !projectId) {
          return {
            disabled: true,
            placeholder: 'Please select a project first',
            options: [],
          };
        }

        const apiKey = auth as string;
        const tasks = await fetchTasks(apiKey, workspaceId as string, projectId as string);

        return {
          options: tasks.map((task: any) => ({
            label: task.name,
            value: task.id,
          })),
        };
      },
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      required: true,
      defaultValue: false
    }),
    tagIds: Property.Array({
      displayName: 'Tag IDs',
      description: 'The IDs of the tags for the time entry',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'Regular', value: 'REGULAR' },
          { label: 'Break', value: 'BREAK' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, projectId, taskId, description, billable, tagIds, type } = context.propsValue;

    const body = {
      start: new Date().toISOString(),
      description,
      billable,
      projectId,
      taskId,
      tagIds,
      type: type ?? 'REGULAR',
    };

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/time-entries`,
      body
    );
  },
});
