import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { descriptAuth, getAuthToken } from '../auth';

const BASE_URL = 'https://descriptapi.com/v1';

type ProjectSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

async function descriptApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body,
    queryParams,
  });
}

async function fetchAllProjects(apiKey: string): Promise<ProjectSummary[]> {
  const projects: ProjectSummary[] = [];
  let cursor: string | undefined = undefined;

  do {
    const params: Record<string, string> = {
      limit: '100',
      sort: 'name',
      direction: 'asc',
    };
    if (cursor) params['cursor'] = cursor;

    const response = await descriptApiCall<{
      data: ProjectSummary[];
      pagination: { next_cursor?: string };
    }>({
      apiKey,
      method: HttpMethod.GET,
      path: '/projects',
      queryParams: params,
    });

    projects.push(...response.body.data);
    cursor = response.body.pagination.next_cursor;
  } while (cursor);

  return projects;
}

const projectIdProp = Property.Dropdown({
  auth: descriptAuth,
  displayName: 'Project',
  description: 'Select the Descript project to use.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const projects = await fetchAllProjects(getAuthToken(auth));
      return {
        disabled: false,
        options: projects.map((p) => ({ label: p.name, value: p.id })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load projects. Check your connection.',
      };
    }
  },
});

const compositionIdProp = (required: boolean) =>
  Property.Dropdown({
    auth: descriptAuth,
    displayName: 'Composition',
    description:
      'Select the composition (timeline) within the project. If omitted, the agent chooses automatically.',
    refreshers: ['project_id'],
    required,
    options: async ({ auth, project_id }) => {
      if (!auth || !project_id || typeof project_id !== 'string') {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a project first',
        };
      }
      try {
        const response = await descriptApiCall<{
          id: string;
          name: string;
          compositions: { id: string; name: string }[];
        }>({
          apiKey: getAuthToken(auth),
          method: HttpMethod.GET,
          path: `/projects/${project_id}`,
        });
        return {
          disabled: false,
          options: response.body.compositions.map((c) => ({
            label: c.name,
            value: c.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load compositions. Check your connection.',
        };
      }
    },
  });

export const descriptCommon = {
  BASE_URL,
  descriptApiCall,
  fetchAllProjects,
  getAuthToken,
  projectIdProp,
  compositionIdProp,
};
