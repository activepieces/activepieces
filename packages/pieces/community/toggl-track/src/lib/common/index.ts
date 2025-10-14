import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';


type TogglOrganization = {
  id: number;
  name: string;
};
type TogglWorkspace = {
  id: number;
  name: string;
};
type TogglClient = {
  id: number;
  name: string;
};
type TogglProject = {
  id: number;
  name: string;
};
type TogglTag = {
  id: number;
  name: string;
};
type TogglTask = {
  id: number;
  name: string;
}

export const togglCommon = {
  organization_id: Property.Dropdown({
    displayName: 'Organization',
    description: 'The organization to operate in.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }
      const apiToken = auth as string;
      const response = await httpClient.sendRequest<TogglOrganization[]>({
        method: HttpMethod.GET,
        url: 'https://api.track.toggl.com/api/v9/me/organizations',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${apiToken}:api_token`
          ).toString('base64')}`,
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: (response.body || []).map((org) => ({
            label: org.name,
            value: org.id,
          })),
        };
      }
      return {
        disabled: true,
        placeholder: 'Error fetching organizations',
        options: [],
      };
    },
  }),
  workspace_id: Property.Dropdown({
    displayName: 'Workspace',
    description: 'The workspace to operate in.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }
      const apiToken = auth as string;
      
      const response = await httpClient.sendRequest<TogglWorkspace[]>({
        method: HttpMethod.GET,
        url: 'https://api.track.toggl.com/api/v9/me/workspaces',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${apiToken}:api_token`
          ).toString('base64')}`,
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          
          options: (response.body || []).map((workspace) => ({
            label: workspace.name,
            value: workspace.id,
          })),
        };
      }
      return {
        disabled: true,
        placeholder: 'Error fetching workspaces',
        options: [],
      };
    },
  }),
  client_id: Property.Dropdown({
    displayName: 'Client',
    description: 'The client to associate the project with.',
    required: false,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) => {
      if (!auth || !workspace_id) {
        return {
          disabled: true,
          placeholder: 'Select a workspace first',
          options: [],
        };
      }
      const apiToken = auth as string;
      const response = await httpClient.sendRequest<TogglClient[]>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/clients`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${apiToken}:api_token`
          ).toString('base64')}`,
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: (response.body || []).map((client) => ({
            label: client.name,
            value: client.id,
          })),
        };
      }
      return {
        disabled: true,
        placeholder: 'Error fetching clients',
        options: [],
      };
    },
  }),
  project_id: Property.Dropdown({
    displayName: 'Project',
    description: 'The project to create the task under.',
    required: true,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) => {
      if (!auth || !workspace_id) {
        return {
          disabled: true,
          placeholder: 'Select a workspace first',
          options: [],
        };
      }
      const apiToken = auth as string;
      const response = await httpClient.sendRequest<TogglProject[]>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/projects`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${apiToken}:api_token`
          ).toString('base64')}`,
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: (response.body || []).map((project) => ({
            label: project.name,
            value: project.id,
          })),
        };
      }
      return {
        disabled: true,
        placeholder: 'Error fetching projects',
        options: [],
      };
    },
  }),
  optional_project_id: Property.Dropdown({
    displayName: 'Project',
    description: 'The project to associate the time entry with.',
    required: false,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) => {
      if (!auth || !workspace_id) {
        return {
          disabled: true,
          placeholder: 'Select a workspace first',
          options: [],
        };
      }
      const apiToken = auth as string;
      const response = await httpClient.sendRequest<TogglProject[]>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/projects`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${apiToken}:api_token`
          ).toString('base64')}`,
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: (response.body || []).map((project) => ({
            label: project.name,
            value: project.id,
          })),
        };
      }
      return {
        disabled: true,
        placeholder: 'Error fetching projects',
        options: [],
      };
    },
  }),
  tags: Property.MultiSelectDropdown({
    displayName: 'Tags',
    description: 'Tags to associate with the time entry. You can create new tags by typing them.',
    required: false,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) => {
      if (!auth || !workspace_id) {
        return {
          disabled: true,
          placeholder: 'Select a workspace first',
          options: [],
        };
      }
      const apiToken = auth as string;
      const response = await httpClient.sendRequest<TogglTag[]>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/tags`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${apiToken}:api_token`
          ).toString('base64')}`,
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: (response.body || []).map((tag) => ({
            label: tag.name,
            value: tag.name,
          })),
        };
      }
      return {
        disabled: true,
        placeholder: 'Error fetching tags',
        options: [],
      };
    },
  }),
  optional_task_id: Property.Dropdown({
    displayName: "Task",
    description: "The task to select.",
    required: false,
    refreshers: ['workspace_id', 'optional_project_id'],
    options: async ({ auth, workspace_id, optional_project_id }) => {
        if (!auth || !workspace_id || !optional_project_id) {
            return {
                disabled: true,
                placeholder: 'Select a workspace and project first',
                options: [],
            };
        }
        const apiToken = auth as string;

        const response = await httpClient.sendRequest<{ data: TogglTask[] }>({
            method: HttpMethod.GET,
            url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/tasks`,
            queryParams: {
                pid: optional_project_id as string
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(
                    `${apiToken}:api_token`
                ).toString('base64')}`,
            },
        });

        if (response.status === 200) {
            return {
                disabled: false,
                options: (response.body.data || []).map((task) => ({
                    label: task.name,
                    value: task.id,
                })),
            };
        }
        
        return {
            disabled: true,
            placeholder: 'Error fetching tasks',
            options: [],
        };
    }
}),
};

