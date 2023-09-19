import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const nitfyCommon = {
  portfolio: Property.Dropdown({
    displayName: 'Portfolio',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      const authentication = auth as OAuth2PropertyValue;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      const accessToken = authentication.access_token;

      const response = (
        await callNitfyApi<{
          subteams: {
            id: string;
            name: string;
          }[];
          items: boolean;
          hasMore: boolean;
        }>(HttpMethod.GET, 'subteams', accessToken, undefined)
      ).body;

      return {
        disabled: false,
        options: response.subteams.map((team) => {
          return {
            label: team.name,
            value: team.id,
          };
        }),
      };
    },
  }),
  project: Property.Dropdown({
    displayName: 'Project',
    required: true,
    refreshers: ['portfolio'],
    options: async ({ auth, portfolio }) => {
      const authentication = auth as OAuth2PropertyValue;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      if (!portfolio) {
        return {
          disabled: true,
          placeholder: 'Select portfolio first',
          options: [],
        };
      }

      const accessToken = authentication.access_token;
      const response = (
        await callNitfyApi<{
          projects: {
            id: string;
            name: string;
            subteam: string;
          }[];
          hasMore: boolean;
        }>(HttpMethod.GET, `projects`, accessToken, undefined)
      ).body;

      response.projects = response.projects.filter((project) => {
        return project.subteam == portfolio;
      });

      return {
        disabled: false,
        options: response.projects.map((project) => {
          return {
            label: project.name,
            value: project.id,
          };
        }),
      };
    },
  }),
  status: Property.Dropdown({
    displayName: 'Status',
    required: true,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      const authentication = auth as OAuth2PropertyValue;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      if (!project) {
        return {
          disabled: true,
          placeholder: 'Select portfolio first',
          options: [],
        };
      }

      const accessToken = authentication.access_token;

      const response = (
        await callNitfyApi<{
          items: {
            id: string;
            name: string;
          }[];
          hasMore: boolean;
        }>(
          HttpMethod.GET,
          `taskgroups?project_id=${project}&archived=false`,
          accessToken,
          undefined
        )
      ).body;

      return {
        disabled: false,
        options: response.items.map((list) => {
          return {
            label: list.name,
            value: list.id,
          };
        }),
      };
    },
  }),
  milestone: Property.Dropdown({
    displayName: 'Milestone',
    required: true,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      const authentication = auth as OAuth2PropertyValue;
      if (!authentication) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }
      if (!project) {
        return {
          disabled: true,
          placeholder: 'Select project first',
          options: [],
        };
      }

      const accessToken = authentication.access_token;

      const response = (
        await callNitfyApi<{
          items: {
            id: string;
            name: string;
            task_group: string;
          }[];
          hasMore: boolean;
        }>(
          HttpMethod.GET,
          `milestones?project_id=${project}&is_list=true`,
          accessToken,
          undefined
        )
      ).body;

      return {
        disabled: false,
        options: response.items.map((list) => {
          return {
            label: list.name,
            value: list.id,
          };
        }),
      };
    },
  }),
};

export async function callNitfyApi<T extends HttpMessageBody>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: any | undefined
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://openapi.niftypm.com/api/v1.0/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: body,
  });
}
