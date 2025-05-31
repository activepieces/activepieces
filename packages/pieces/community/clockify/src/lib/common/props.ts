import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

interface Workspace {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  clientName?: string;
}

interface Task {
  id: string;
  name: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
}

export const clockifyCommon = {
  workspace_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Workspace',
      description: 'Select the workspace',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const workspaces = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/workspaces'
          ) as Workspace[];

          return {
            disabled: false,
            options: workspaces.map((workspace) => ({
              label: workspace.name,
              value: workspace.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load workspaces',
          };
        }
      },
    }),

  project_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Project',
      description: 'Select the project',
      required,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select workspace first',
          };
        }

        try {
          const projects = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/workspaces/${workspaceId}/projects`
          ) as Project[];

          return {
            disabled: false,
            options: projects.map((project) => ({
              label: project.clientName ? `${project.name} (${project.clientName})` : project.name,
              value: project.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load projects',
          };
        }
      },
    }),

  task_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Task',
      description: 'Select the task',
      required,
      refreshers: ['workspaceId', 'projectId'],
      options: async ({ auth, workspaceId, projectId }) => {
        if (!auth || !workspaceId || !projectId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select workspace and project first',
          };
        }

        try {
          const tasks = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/workspaces/${workspaceId}/projects/${projectId}/tasks`
          ) as Task[];

          return {
            disabled: false,
            options: tasks.map((task) => ({
              label: `${task.name} (${task.status})`,
              value: task.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load tasks',
          };
        }
      },
    }),

  user_id: (required = true) =>
    Property.Dropdown({
      displayName: 'User',
      description: 'Select the user',
      required,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account and select workspace first',
          };
        }

        try {
          const users = await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/workspaces/${workspaceId}/users`
          ) as User[];

          return {
            disabled: false,
            options: users.map((user) => ({
              label: user.name ? `${user.name} (${user.email})` : user.email,
              value: user.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load users',
          };
        }
      },
    }),
};
