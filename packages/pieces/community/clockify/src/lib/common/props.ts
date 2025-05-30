import { Property, DropdownOption } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './index';

export const workspaceIdDropdown = Property.Dropdown({
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
    const workspaces = await makeRequest(apiKey, HttpMethod.GET, '/workspaces');
    const options: DropdownOption<string>[] = workspaces.map((workspace: any) => ({
      label: workspace.name,
      value: workspace.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const projectIdDropdown = Property.Dropdown({
  displayName: 'Project',
  required: true,
  refreshers: ['workspaceId'],
  options: async ({ auth, workspaceId }) => {
    if (!auth || !workspaceId) {
      return {
        disabled: true,
        placeholder: 'Select a workspace first',
        options: [],
      };
    }

    const apiKey = auth as string;
    const projects = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/projects`
    );
    const options: DropdownOption<string>[] = projects.map((project: any) => ({
      label: project.name,
      value: project.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const taskIdDropdown = Property.Dropdown({
  displayName: 'Task',
  required: true,
  refreshers: ['workspaceId', 'projectId'],
  options: async ({ auth, workspaceId, projectId }) => {
    if (!auth || !workspaceId || !projectId) {
      return {
        disabled: true,
        placeholder: 'Select a workspace and project first',
        options: [],
      };
    }

    const apiKey = auth as string;
    const tasks = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/projects/${projectId}/tasks`
    );
    const options: DropdownOption<string>[] = tasks.map((task: any) => ({
      label: task.name,
      value: task.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const userIdDropdown = Property.Dropdown({
  displayName: 'User',
  required: true,
  refreshers: ['workspaceId'],
  options: async ({ auth, workspaceId }) => {
    if (!auth || !workspaceId) {
      return {
        disabled: true,
        placeholder: 'Select a workspace first',
        options: [],
      };
    }

    const apiKey = auth as string;
    const users = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/users`
    );

    const options: DropdownOption<string>[] = users.map((user: any) => ({
      label: user.name || user.email,
      value: user.id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});
