import { HttpMethod, httpClient, HttpResponse } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { AuthenticationType } from '@activepieces/pieces-common';
import { meistertaskAuth, getAccessToken } from '../auth';

export const MEISTERTASK_API_URL = 'https://www.meistertask.com/api';

export interface MeisterTaskItem {
  id: number | string;
  name?: string;
  status?: number;
  status_updated_at?: string;
  created_at?: string;
  updated_at?: string;
  firstname?: string;
  lastname?: string;
}

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
        const token = getAccessToken(auth);

        const response = await httpClient.sendRequest<MeisterTaskItem[]>({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        const projects = Array.isArray(response.body) ? response.body : [];
        return {
          disabled: false,
          options: projects.map((project) => ({
            label: project.name || String(project.id),
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
        const token = getAccessToken(auth);
        const response = await httpClient.sendRequest<MeisterTaskItem[]>({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/sections`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        const sections = Array.isArray(response.body) ? response.body : [];
        return {
          disabled: false,
          options: sections.map((section) => ({
            label: section.name || String(section.id),
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

  task_id: Property.Dropdown({
    auth: meistertaskAuth,
    displayName: 'Task',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a task first',
        };
      }

      try {
        const token = getAccessToken(auth);

        const response = await httpClient.sendRequest<MeisterTaskItem[]>({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/tasks`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        const tasks = Array.isArray(response.body) ? response.body : [];
        return {
          disabled: false,
          options: tasks.map((task) => ({
            label: task.name || String(task.id),
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

  label: Property.Dropdown({
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
        const token = getAccessToken(auth);

        const response = await httpClient.sendRequest<MeisterTaskItem[]>({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/labels`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        const labels = Array.isArray(response.body) ? response.body : [];
        return {
          disabled: false,
          options: labels.map((label) => ({
            label: label.name || String(label.id),
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
        const token = getAccessToken(auth);

        const response = await httpClient.sendRequest<MeisterTaskItem[]>({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects/${project}/persons`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: token,
          },
        });

        const persons = Array.isArray(response.body) ? response.body : [];
        return {
          disabled: false,
          options: persons.map((person) => ({
            label: `${person.firstname || ''} ${person.lastname || ''}`.trim() || String(person.id),
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

export async function makeRequest<T = unknown>(
  method: HttpMethod,
  url: string,
  token: string,
  body?: unknown
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${MEISTERTASK_API_URL}${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body,
  });
}

export { getAccessToken };
