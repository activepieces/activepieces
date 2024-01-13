import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { ClickupTask, ClickupWorkspace } from './models';

export const clickupCommon = {
  workspace_id: (required = true) =>
    Property.Dropdown({
      description: 'The ID of the ClickUp workspace to create the task in',
      displayName: 'Workspace',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = (
          await callClickUpApi<{
            teams: {
              id: string;
              name: string;
            }[];
          }>(HttpMethod.GET, 'team', accessToken, undefined)
        ).body;
        return {
          disabled: false,
          options: response.teams.map((workspace) => {
            return {
              label: workspace.name,
              value: workspace.id,
            };
          }),
        };
      },
    }),
  space_id: (required = true) =>
    Property.Dropdown({
      description: 'The ID of the ClickUp space to create the task in',
      displayName: 'Space',
      required,
      refreshers: ['workspace_id'],
      defaultValue: null,
      options: async ({ auth, workspace_id }) => {
        if (!auth || !workspace_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select workspace',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listSpaces(accessToken, workspace_id as string);
        return {
          disabled: false,
          options: response.spaces.map((space) => {
            return {
              label: space.name,
              value: space.id,
            };
          }),
        };
      },
    }),
  list_id: (required = true) =>
    Property.Dropdown({
      description: 'The ID of the ClickUp space to create the task in',
      displayName: 'List',
      required,
      refreshers: ['space_id', 'workspace_id'],
      defaultValue: null,
      options: async ({ auth, space_id }) => {
        if (!auth || !space_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select a space',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const responseFolders = await listFolders(
          accessToken,
          space_id as string
        );
        const promises: Promise<{ lists: { id: string; name: string }[] }>[] = [
          listFolderlessList(accessToken, space_id as string),
        ];
        for (let i = 0; i < responseFolders.folders.length; ++i) {
          promises.push(listLists(accessToken, responseFolders.folders[i].id));
        }
        const listsResponses = await Promise.all(promises);

        let lists: { name: string; id: string }[] = [];
        for (let i = 0; i < listsResponses.length; ++i) {
          lists = [...lists, ...listsResponses[i].lists];
        }
        return {
          disabled: false,
          options: lists.map((list) => {
            return {
              label: list.name,
              value: list.id,
            };
          }),
        };
      },
    }),
  task_id: (required = true) =>
    Property.Dropdown({
      description: 'The ID of the ClickUp task',
      displayName: 'Task Id',
      required,
      defaultValue: null,
      refreshers: ['space_id', 'list_id', 'workspace_id'],
      options: async ({ auth, space_id, list_id }) => {
        if (!auth || !list_id || !space_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace, space and list',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listTasks(accessToken, list_id as string);
        return {
          disabled: false,
          options: response.tasks.map((task) => {
            return {
              label: task.name,
              value: task.id,
            };
          }),
        };
      },
    }),
  folder_id: (required = false) =>
    Property.Dropdown({
      description: 'The ID of the ClickUp folder',
      displayName: 'Folder Id',
      refreshers: ['space_id', 'workplace_id'],
      defaultValue: null,
      required,
      options: async ({ auth, space_id, workplace_id }) => {
        if (
          auth === undefined ||
          workplace_id === undefined ||
          space_id === undefined
        ) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace and space',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listFolders(accessToken, space_id as string);
        return {
          disabled: false,
          options: response.folders.map((task) => {
            return {
              label: task.name,
              value: task.id,
            };
          }),
        };
      },
    }),
  status_id: (required = false) =>
    Property.Dropdown({
      description: 'The ID of Clickup Issue Status',
      displayName: 'Status Id',
      refreshers: ['list_id'],
      defaultValue: null,
      required,
      options: async ({ auth, list_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'conncet your account first',
            options: [],
          };
        }
        if (!list_id) {
          return {
            disabled: true,
            placeholder: 'select list',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await getList(accessToken, list_id as string);
        return {
          disabled: false,
          options: response.statuses.map((status) => {
            return {
              label: status.status,
              value: status.status,
            };
          }),
        };
      },
    }),
  priority_id: (required = false) =>
    Property.StaticDropdown({
      displayName: 'Priority Id',
      defaultValue: null,
      description: 'The ID of Clickup Issue Priority',
      required,
      options: {
        options: [
          {
            label: 'Urgent',
            value: 1,
          },
          {
            label: 'High',
            value: 2,
          },
          {
            label: 'Normal',
            value: 3,
          },
          {
            label: 'Low',
            value: 4,
          },
        ],
      },
    }),
  assignee_id: (
    required = false,
    displayName = 'Assignee Id',
    description: string
  ) =>
    Property.MultiSelectDropdown({
      displayName: displayName,
      description: description,
      required,
      refreshers: ['workspace_id'],
      options: async ({ auth, workspace_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'conncet your account first',
            options: [],
          };
        }
        if (!workspace_id) {
          return {
            disabled: true,
            placeholder: 'select workspace',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listWorkspaceMembers(
          accessToken,
          workspace_id as string
        );
        return {
          disabled: false,
          options: response.map((member) => {
            return {
              label: member.user.username,
              value: member.user.id,
            };
          }),
        };
      },
    }),
  template_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Template Id',
      required,
      description: 'The ID of Clickup Task Template',
      refreshers: ['workspace_id'],
      options: async ({ auth, workspace_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'conncet your account first',
            options: [],
          };
        }
        if (!workspace_id) {
          return {
            disabled: true,
            placeholder: 'select workspace',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listWorkspaceTemplates(
          accessToken,
          workspace_id as string
        );
        return {
          disabled: false,
          options: response.templates.map((template) => {
            return {
              label: template.name,
              value: template.id,
            };
          }),
        };
      },
    }),
};

async function listWorkspaces(accessToken: string) {
  return (
    await callClickUpApi<{ teams: ClickupWorkspace[] }>(
      HttpMethod.GET,
      'team',
      accessToken,
      undefined
    )
  ).body;
}

async function getWorkspace(accessToken: string, workspaceId: string) {
  const { teams } = await listWorkspaces(accessToken as string);
  const workspace = teams.filter((workspace) => workspace.id === workspaceId);
  return workspace[0];
}

async function listWorkspaceMembers(accessToken: string, workspaceId: string) {
  const workspace = await getWorkspace(accessToken, workspaceId);
  return workspace.members;
}

async function listWorkspaceTemplates(
  accessToken: string,
  workspaceId: string
) {
  return (
    await callClickUpApi<{
      templates: {
        id: string;
        name: string;
      }[];
    }>(
      HttpMethod.GET,
      `team/${workspaceId}/taskTemplate`,
      accessToken,
      undefined
    )
  ).body;
}
async function listSpaces(accessToken: string, workspaceId: string) {
  return (
    await callClickUpApi<{
      spaces: {
        id: string;
        name: string;
      }[];
    }>(HttpMethod.GET, `team/${workspaceId}/space`, accessToken, undefined)
  ).body;
}

async function listLists(accessToken: string, folderId: string) {
  return (
    await callClickUpApi<{
      lists: {
        id: string;
        name: string;
      }[];
    }>(HttpMethod.GET, `folder/${folderId}/list`, accessToken, undefined)
  ).body;
}
async function getList(accessToken: string, listId: string) {
  return (
    await callClickUpApi<{
      statuses: {
        id: string;
        status: string;
      }[];
    }>(HttpMethod.GET, `list/${listId}`, accessToken, undefined)
  ).body;
}

async function listFolders(accessToken: string, spaceId: string) {
  return (
    await callClickUpApi<{
      folders: {
        id: string;
        name: string;
      }[];
    }>(HttpMethod.GET, `space/${spaceId}/folder`, accessToken, undefined)
  ).body;
}

async function listFolderlessList(accessToken: string, spaceId: string) {
  return (
    await callClickUpApi<{
      lists: {
        id: string;
        name: string;
      }[];
    }>(HttpMethod.GET, `space/${spaceId}/list`, accessToken, undefined)
  ).body;
}

export async function listTasks(accessToken: string, listId: string) {
  return (
    await callClickUpApi<{
      tasks: {
        id: string;
        name: string;
      }[];
    }>(HttpMethod.GET, `list/${listId}/task`, accessToken, undefined)
  ).body;
}

export async function callClickupGetTask(accessToken: string, taskId: string) {
  return (
    await callClickUpApi<ClickupTask>(
      HttpMethod.GET,
      `task/${taskId}`,
      accessToken,
      undefined
    )
  ).body;
}

export async function callClickUpApi<T extends HttpMessageBody>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: any | undefined
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://api.clickup.com/api/v2/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: body,
  });
}
