import { HttpRequest, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

const BASE_URL = 'https://www.meistertask.com/api';

export async function apiRequest<T>(auth: OAuth2PropertyValue, method: HttpMethod, url: string, body?: any): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  const resp = await httpClient.sendRequest<T>(request);
  if (resp.status >= 400) {
    throw new Error(`MeisterTask API Error ${resp.status}: ${JSON.stringify(resp.body)}`);
  }
  return resp.body;
}

export async function getProjects(auth: OAuth2PropertyValue) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, '/projects');
}

export async function getSections(auth: OAuth2PropertyValue, projectId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/projects/${projectId}/sections`);
}

export async function getPersons(auth: OAuth2PropertyValue, projectId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/projects/${projectId}/persons`);
}

export async function getLabels(auth: OAuth2PropertyValue, projectId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/projects/${projectId}/labels`);
}

export async function getTasks(auth: OAuth2PropertyValue, projectId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/projects/${projectId}/tasks`);
}

export async function getAttachments(auth: OAuth2PropertyValue, taskId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/tasks/${taskId}/attachments`);
}

export async function getComments(auth: OAuth2PropertyValue, taskId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/tasks/${taskId}/comments`);
}

export async function getChecklistItems(auth: OAuth2PropertyValue, taskId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/tasks/${taskId}/checklist_items`);
}

export async function getTaskLabels(auth: OAuth2PropertyValue, taskId: string) {
  return await apiRequest<any[]>(auth, HttpMethod.GET, `/tasks/${taskId}/labels`);
}
