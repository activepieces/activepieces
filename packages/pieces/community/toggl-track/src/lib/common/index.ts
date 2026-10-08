import { Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { TogglAuthValue, togglApi } from './client';
import { TwoClient, TwoProject, TwoTag, TwoTask } from './models';

async function loadOptions<T extends number | string>({
  auth,
  missing,
  errorLabel,
  load,
}: {
  auth: TogglAuthValue | undefined;
  missing: string | null;
  errorLabel: string;
  load: (auth: TogglAuthValue) => Promise<DropdownOption<T>[]>;
}): Promise<DropdownState<T>> {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'Connect your account first',
      options: [],
    };
  }
  if (missing) {
    return { disabled: true, placeholder: missing, options: [] };
  }
  try {
    const options = await load(auth);
    return { disabled: false, options };
  } catch (error) {
    return {
      disabled: true,
      placeholder: `Error fetching ${errorLabel}: ${togglApi.errorText(error)}`,
      options: [],
    };
  }
}

async function listOrganizations(auth: TogglAuthValue): Promise<DropdownOption<number>[]> {
  if (togglApi.isTwo(auth)) {
    const organizationId = togglApi.twoOrganizationId(auth);
    return [{ label: `Organization ${organizationId}`, value: organizationId }];
  }
  const organizations = await togglApi.request<Named[]>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: '/me/organizations',
  });
  return (organizations ?? []).map((org) => ({ label: org.name, value: org.id }));
}

async function listWorkspaces(auth: TogglAuthValue): Promise<DropdownOption<number>[]> {
  if (togglApi.isTwo(auth)) {
    const workspaces = await togglApi.twoWorkspaces(auth);
    return workspaces.map((workspace) => ({
      label: workspace.name,
      value: workspace.id,
    }));
  }
  const workspaces = await togglApi.request<Named[]>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: '/me/workspaces',
  });
  return (workspaces ?? []).map((workspace) => ({
    label: workspace.name,
    value: workspace.id,
  }));
}

async function listClients({
  auth,
  workspaceId,
}: {
  auth: TogglAuthValue;
  workspaceId: number;
}): Promise<DropdownOption<number>[]> {
  if (togglApi.isTwo(auth)) {
    const clients = await togglApi.listTwoPages<TwoClient>({
      auth,
      path: `/workspaces/${workspaceId}/clients`,
    });
    return clients.map((client) => ({ label: client.name, value: client.id }));
  }
  const clients = await togglApi.request<Named[] | null>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: `/workspaces/${workspaceId}/clients`,
  });
  return (clients ?? []).map((client) => ({
    label: client.name,
    value: client.id,
  }));
}

async function listProjects({
  auth,
  workspaceId,
}: {
  auth: TogglAuthValue;
  workspaceId: number;
}): Promise<DropdownOption<number>[]> {
  if (togglApi.isTwo(auth)) {
    const projects = await togglApi.listTwoPages<TwoProject>({
      auth,
      path: togglApi.twoWorkspacePath({
        auth,
        workspaceId,
        path: '/projects',
      }),
      queryParams: { archived: 'false' },
    });
    return projects.map((project) => ({
      label: project.name,
      value: project.id,
    }));
  }
  const projects = await togglApi.request<Named[] | null>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: `/workspaces/${workspaceId}/projects`,
  });
  return (projects ?? []).map((project) => ({
    label: project.name,
    value: project.id,
  }));
}

async function listTags({
  auth,
  workspaceId,
}: {
  auth: TogglAuthValue;
  workspaceId: number;
}): Promise<DropdownOption<string>[]> {
  if (togglApi.isTwo(auth)) {
    const tags = await togglApi.listTwoPages<TwoTag>({
      auth,
      path: `/workspaces/${workspaceId}/tags`,
    });
    return tags.map((tag) => ({ label: tag.name, value: tag.name }));
  }
  const tags = await togglApi.request<Named[] | null>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: `/workspaces/${workspaceId}/tags`,
  });
  return (tags ?? []).map((tag) => ({ label: tag.name, value: tag.name }));
}

async function listTasks({
  auth,
  workspaceId,
  projectId,
}: {
  auth: TogglAuthValue;
  workspaceId: number;
  projectId: number;
}): Promise<DropdownOption<number>[]> {
  if (togglApi.isTwo(auth)) {
    const tasks = await togglApi.listTwoPages<TwoTask>({
      auth,
      path: togglApi.twoWorkspacePath({ auth, workspaceId, path: '/tasks' }),
      queryParams: { project_id: String(projectId), archived: 'false' },
    });
    return tasks.map((task) => ({ label: task.name, value: task.id }));
  }
  const response = await togglApi.request<{ data: Named[] | null }>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: `/workspaces/${workspaceId}/tasks`,
    queryParams: { pid: String(projectId) },
  });
  return (response?.data ?? []).map((task) => ({
    label: task.name,
    value: task.id,
  }));
}

function clientDropdown({
  required,
  description,
}: {
  required: boolean;
  description: string;
}) {
  return Property.Dropdown({
    auth: togglTrackAuth,
    displayName: 'Client',
    description,
    required,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) =>
      loadOptions({
        auth,
        missing: workspace_id ? null : 'Select a workspace first',
        errorLabel: 'clients',
        load: (connection) =>
          listClients({
            auth: connection,
            workspaceId: togglApi.requireId({
              value: workspace_id,
              label: 'Workspace',
            }),
          }),
      }),
  });
}

async function listTagIds({
  auth,
  workspaceId,
}: {
  auth: TogglAuthValue;
  workspaceId: number;
}): Promise<DropdownOption<number>[]> {
  if (togglApi.isTwo(auth)) {
    const tags = await togglApi.listTwoPages<TwoTag>({
      auth,
      path: `/workspaces/${workspaceId}/tags`,
    });
    return tags.map((tag) => ({ label: tag.name, value: tag.id }));
  }
  const tags = await togglApi.request<Named[] | null>({
    auth,
    method: togglApi.HttpMethod.GET,
    path: `/workspaces/${workspaceId}/tags`,
  });
  return (tags ?? []).map((tag) => ({ label: tag.name, value: tag.id }));
}

function workspaceDropdown({ required }: { required: boolean }) {
  return Property.Dropdown({
    auth: togglTrackAuth,
    displayName: 'Workspace',
    description: required
      ? 'The workspace to operate in.'
      : 'The workspace to search in. Toggl Track (Classic): leave empty to search all workspaces. Toggl 2.0: leave empty to use your current workspace.',
    required,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        missing: null,
        errorLabel: 'workspaces',
        load: listWorkspaces,
      }),
  });
}

function projectDropdown({
  required,
  description,
}: {
  required: boolean;
  description: string;
}) {
  return Property.Dropdown({
    auth: togglTrackAuth,
    displayName: 'Project',
    description,
    required,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) =>
      loadOptions({
        auth,
        missing: workspace_id ? null : 'Select a workspace first',
        errorLabel: 'projects',
        load: (connection) =>
          listProjects({
            auth: connection,
            workspaceId: togglApi.requireId({
              value: workspace_id,
              label: 'Workspace',
            }),
          }),
      }),
  });
}

function updateFlag({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticDropdown({
    displayName,
    description: `${description} Leave empty to keep the current value.`,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function flagValue(value: string | undefined | null): boolean | undefined {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return undefined;
}

export const togglCommon = {
  updateFlag,
  flagValue,
  organization_id: Property.Dropdown({
    auth: togglTrackAuth,
    displayName: 'Organization',
    description:
      'The organization to operate in. For Toggl 2.0 this is the organization from the connection.',
    required: true,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        missing: null,
        errorLabel: 'organizations',
        load: listOrganizations,
      }),
  }),
  workspace_id: workspaceDropdown({ required: true }),
  optional_workspace_id: workspaceDropdown({ required: false }),
  client_id: clientDropdown({
    required: false,
    description: 'The client to associate the project with.',
  }),
  required_client_id: clientDropdown({
    required: true,
    description: 'The client to use. Agents can pass the client ID directly.',
  }),
  tag_id: Property.Dropdown({
    auth: togglTrackAuth,
    displayName: 'Tag',
    description: 'The tag to use. Agents can pass the tag ID directly.',
    required: true,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) =>
      loadOptions({
        auth,
        missing: workspace_id ? null : 'Select a workspace first',
        errorLabel: 'tags',
        load: (connection) =>
          listTagIds({
            auth: connection,
            workspaceId: togglApi.requireId({
              value: workspace_id,
              label: 'Workspace',
            }),
          }),
      }),
  }),
  project_id: projectDropdown({
    required: true,
    description: 'The project to create the task under.',
  }),
  optional_project_id: projectDropdown({
    required: false,
    description: 'The project to associate the time entry with.',
  }),
  tags: Property.MultiSelectDropdown({
    auth: togglTrackAuth,
    displayName: 'Tags',
    description:
      'Tags to associate with the time entry. Tags that do not exist yet are created in the workspace.',
    required: false,
    refreshers: ['workspace_id'],
    options: async ({ auth, workspace_id }) =>
      loadOptions({
        auth,
        missing: workspace_id ? null : 'Select a workspace first',
        errorLabel: 'tags',
        load: (connection) =>
          listTags({
            auth: connection,
            workspaceId: togglApi.requireId({
              value: workspace_id,
              label: 'Workspace',
            }),
          }),
      }),
  }),
  optional_task_id: Property.Dropdown({
    auth: togglTrackAuth,
    displayName: 'Task',
    description: 'The task to select.',
    required: false,
    refreshers: ['workspace_id', 'optional_project_id'],
    options: async ({ auth, workspace_id, optional_project_id }) =>
      loadOptions({
        auth,
        missing:
          workspace_id && optional_project_id
            ? null
            : 'Select a workspace and project first',
        errorLabel: 'tasks',
        load: (connection) =>
          listTasks({
            auth: connection,
            workspaceId: togglApi.requireId({
              value: workspace_id,
              label: 'Workspace',
            }),
            projectId: togglApi.requireId({
              value: optional_project_id,
              label: 'Project',
            }),
          }),
      }),
  }),
};

type Named = { id: number; name: string };

type DropdownOption<T> = { label: string; value: T };

type DropdownState<T> = {
  disabled: boolean;
  placeholder?: string;
  options: DropdownOption<T>[];
};
