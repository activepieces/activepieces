import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.clockify.me/api/v1';

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });

  return response.body;
}

export async function fetchWorkspaces(apiKey: string) {
  return await makeRequest(apiKey, HttpMethod.GET, '/workspaces');
}

export async function fetchProjects(apiKey: string, workspaceId: string) {
  return await makeRequest(apiKey, HttpMethod.GET, `/workspaces/${workspaceId}/projects`);
}

export async function fetchTasks(apiKey: string, workspaceId: string, projectId: string) {
  return await makeRequest(apiKey, HttpMethod.GET, `/workspaces/${workspaceId}/projects/${projectId}/tasks`);
}

export async function fetchUsers(apiKey: string, workspaceId: string) {
  return await makeRequest(apiKey, HttpMethod.GET, `/workspaces/${workspaceId}/users`);
}
