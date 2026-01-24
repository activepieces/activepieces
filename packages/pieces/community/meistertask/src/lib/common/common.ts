import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { AuthenticationType } from '@activepieces/pieces-common';
import { meistertaskAuth } from '../../index';

export const MEISTERTASK_API_URL = 'https://www.meistertask.com/api';

export const meisterTaskCommon = {
  baseUrl: MEISTERTASK_API_URL,

  project: Property.Dropdown({
    auth: meistertaskAuth,
    displayName: 'Project',
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

      try {
        const token = typeof auth === 'string' ? auth : (auth).access_token;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((project: any) => ({
            label: project.name,
            value: project.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching projects:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading projects. Please reconnect your account.',
        };
      }
    },
  }),

  section: Property.Dropdown({
    auth: meistertaskAuth,
    displayName: 'Section',
    required: true,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      if (!auth || !project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/sections`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((section: any) => ({
            label: section.name,
            value: section.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching sections:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading sections',
        };
      }
    },
  }),
  task_id: Property.Dropdown<{ name: string; id: string },true,typeof meistertaskAuth>({
    auth: meistertaskAuth,
    displayName: 'Task',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a  first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/tasks`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((task: any) => ({
            label: task.name,
            value: task.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading tasks',
        };
      }
    },
  }),

  label: Property.Dropdown<{ name: string; id: string },true,typeof meistertaskAuth>({
    auth: meistertaskAuth,
    displayName: 'Label',
    required: true,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      if (!auth || !project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/labels`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((label: any) => ({
            label: label.name,
            value: label.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching labels:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading labels',
        };
      }
    },
  }),

  person: Property.Dropdown({
    auth: meistertaskAuth,
    displayName: 'Person',
    required: false,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      if (!auth || !project) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }

      try {
        const token = typeof auth === 'string' ? auth : (auth as any).access_token;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/persons`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        return {
          disabled: false,
          options: response.body.map((person: any) => ({
            label: `${person.firstname} ${person.lastname}`,
            value: person.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching persons:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading persons',
        };
      }
    },
  }),
};

export async function makeRequest(
  method: HttpMethod,
  url: string,
  token: string,
  body?: any
) {
  return await httpClient.sendRequest({
    method,
    url: `${MEISTERTASK_API_URL}${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body,
  });
}

