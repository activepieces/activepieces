import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const asanaCommon = {
  workspace: Property.Dropdown({
    description: 'Asana workspace to create the task in',
    displayName: 'Workspace',
    required: true,
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
        await callAsanaApi<{
          data: {
            gid: string;
            name: string;
          }[];
        }>(HttpMethod.GET, 'workspaces', accessToken, undefined)
      ).body;
      return {
        disabled: false,
        options: response.data.map((workspace) => {
          return {
            label: workspace.name,
            value: workspace.gid,
          };
        }),
      };
    },
  }),
  project: Property.Dropdown({
    description: 'Asana Project to create the task in',
    displayName: 'Project',
    required: true,
    refreshers: ['workspace'],
    options: async ({ auth, workspace }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      if (!workspace) {
        return {
          disabled: true,
          placeholder: 'Select workspace first',
          options: [],
        };
      }
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const response = (
        await callAsanaApi<{
          data: {
            gid: string;
            name: string;
          }[];
        }>(
          HttpMethod.GET,
          'projects?workspace=' + workspace,
          accessToken,
          undefined
        )
      ).body;
      return {
        disabled: false,
        options: response.data.map((project) => {
          return {
            label: project.name,
            value: project.gid,
          };
        }),
      };
    },
  }),
  assignee: Property.Dropdown<string>({
    description: 'Assignee for the task',
    displayName: 'Assignee',
    required: false,
    refreshers: ['workspace'],
    options: async ({ auth, workspace }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      if (!workspace) {
        return {
          disabled: true,
          placeholder: 'Select workspace first',
          options: [],
        };
      }
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const users = await getUsers(accessToken, workspace as string);
      return {
        disabled: false,
        options: users.map((user) => {
          return {
            label: user.name,
            value: user.gid,
          };
        }),
      };
    },
  }),
  tags: Property.MultiSelectDropdown<string>({
    description: 'Tags to add to the task',
    displayName: 'Tags',
    required: false,
    refreshers: ['workspace'],
    options: async ({ auth, workspace }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      if (!workspace) {
        return {
          disabled: true,
          placeholder: 'Select workspace first',
          options: [],
        };
      }
      const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
      const response = await getTags(accessToken, workspace as string);
      return {
        disabled: false,
        options: response.map((project) => {
          return {
            label: project.name,
            value: project.gid,
          };
        }),
      };
    },
  }),
};

export async function getUsers(
  accessToken: string,
  workspace: string
): Promise<
  {
    gid: string;
    name: string;
  }[]
> {
  const response = (
    await callAsanaApi<{
      data: {
        gid: string;
        name: string;
      }[];
    }>(HttpMethod.GET, 'users?workspace=' + workspace, accessToken, undefined)
  ).body;
  return response.data;
}

export async function getTags(
  accessToken: string,
  workspace: string
): Promise<
  {
    gid: string;
    name: string;
  }[]
> {
  const response = (
    await callAsanaApi<{
      data: {
        gid: string;
        name: string;
      }[];
    }>(
      HttpMethod.GET,
      'workspaces/' + workspace + '/tags',
      accessToken,
      undefined
    )
  ).body;
  return response.data;
}

export async function callAsanaApi<T extends HttpMessageBody = any>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: any | undefined
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://app.asana.com/api/1.0/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: body,
  });
}
