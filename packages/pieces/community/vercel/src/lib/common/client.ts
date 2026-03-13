import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { VercelAuthValue } from './auth';

const BASE_URL = 'https://api.vercel.com';

export type VercelApiCallParams = {
  method: HttpMethod;
  path: `/${string}`;
  auth: VercelAuthValue;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export async function vercelApiCall<TResponse>({
  method,
  path,
  auth,
  query,
  body,
}: VercelApiCallParams): Promise<TResponse> {
  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = String(value);
      }
    }
  }

  if (auth.props.teamId) {
    queryParams['teamId'] = auth.props.teamId;
  } else if (auth.props.slug) {
    queryParams['slug'] = auth.props.slug;
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.props.token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    body,
  };

  const response = await httpClient.sendRequest<TResponse>(request);
  return response.body;
}

export type VercelProject = {
  id: string;
  name: string;
  framework?: string | null;
  accountId?: string;
  latestDeployments?: Array<{
    id?: string;
    url?: string;
    readyState?: string;
    state?: string;
    target?: string;
  }>;
  link?: {
    repo?: string;
    org?: string;
    repoId?: string | number;
    type?: string;
  } | null;
  updatedAt?: number;
  createdAt?: number;
};

export async function listAllProjects(auth: VercelAuthValue, search?: string): Promise<VercelProject[]> {
  const projects: VercelProject[] = [];
  let nextFrom: string | undefined = undefined;
  const MAX_PAGES = 10;
  let pageCount = 0;

  while (pageCount < MAX_PAGES) {
    pageCount += 1;
    const response: {
      projects?: VercelProject[];
      pagination?: {
        next?: number | string | null;
        count?: number;
        prev?: number | string | null;
      };
    } | VercelProject[] = await vercelApiCall({
      method: HttpMethod.GET,
      path: '/v10/projects',
      auth,
      query: {
        limit: 100,
        from: nextFrom,
        search,
      },
    });

    const batch = Array.isArray(response) ? response : (response.projects ?? []);
    projects.push(...batch);

    const next: number | string | null | undefined = Array.isArray(response)
      ? undefined
      : response.pagination?.next;
    if (!next) {
      break;
    }
    nextFrom = String(next);
  }

  return projects;
}

export function toProjectDropdownOptions(projects: VercelProject[]) {
  return projects.map((project) => ({
    label: project.name,
    value: project.id,
  }));
}

export type VercelDeployment = {
  uid: string;
  name: string;
  url: string | null;
  state?: string;
  target?: string | null;
  created: number;
};

export async function listDeployments(
  auth: VercelAuthValue,
  projectId: string,
): Promise<VercelDeployment[]> {
  const response = await vercelApiCall<{
    deployments: VercelDeployment[];
    pagination: { next?: number | null };
  }>({
    method: HttpMethod.GET,
    path: '/v6/deployments',
    auth,
    query: {
      projectId,
      limit: 100,
    },
  });
  return response.deployments ?? [];
}
