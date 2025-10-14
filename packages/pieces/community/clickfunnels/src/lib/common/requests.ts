import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  API_ENDPOINTS,
  CLICKFUNNELS_BASE_URL,
  CLICKFUNNELS_APIKEY_AUTH,
} from './constants';

async function fireHttpRequest<T>({
  method,
  auth,
  path,
  body,
}: {
  auth: CLICKFUNNELS_APIKEY_AUTH;
  method: HttpMethod;
  path: string;
  body?: unknown;
}) {
  const BASE_URL = CLICKFUNNELS_BASE_URL(auth.subdomain);

  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.apiKey}`,
      },
      body,
    })
    .then((res) => res.body);
}

export const clickfunnelsApiService = {
  fetchCurrentlyLoggedInUser: async (auth: CLICKFUNNELS_APIKEY_AUTH) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: API_ENDPOINTS.ME,
    });

    return response;
  },
  fetchTeams: async (auth: CLICKFUNNELS_APIKEY_AUTH) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: API_ENDPOINTS.TEAMS,
    });

    return response;
  },
  fetchTeam: async (auth: CLICKFUNNELS_APIKEY_AUTH, teamId: string) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.TEAMS}/${teamId}`,
    });

    return response;
  },
  fetchWorkspaces: async (auth: CLICKFUNNELS_APIKEY_AUTH, teamId: string) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.TEAMS}/${teamId}${API_ENDPOINTS.WORKSPACES}`,
    });

    return response;
  },
  fetchContacts: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    workspaceId: string
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}${API_ENDPOINTS.CONTACTS}`,
    });

    return response;
  },
  fetchContactByEmailSearch: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    workspaceId: string,
    filterQuery: string
  ) => {
    const isEmail = filterQuery.includes('@');

    const filterParam = isEmail
      ? `filter[email_address]=${encodeURIComponent(filterQuery)}`
      : `filter[id]=${encodeURIComponent(filterQuery)}`;

    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}${API_ENDPOINTS.CONTACTS}?${filterParam}`,
    });

    return response;
  },
  upsertContact: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    workspaceId: string,
    payload: any
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.POST,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}${API_ENDPOINTS.CONTACTS}/upsert`,
      body: payload,
    });

    return response;
  },
  fetchTags: async (auth: CLICKFUNNELS_APIKEY_AUTH, workspaceId: string) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}${API_ENDPOINTS.CONTACTS}${API_ENDPOINTS.TAGS}`,
    });

    return response;
  },
  fetchCourses: async (auth: CLICKFUNNELS_APIKEY_AUTH, workspaceId: string) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}${API_ENDPOINTS.COURSES}`,
    });

    return response;
  },
  createCourseEnrollment: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    courseId: string,
    payload: any
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.POST,
      auth,
      path: `${API_ENDPOINTS.COURSES}/${courseId}/enrollments`,
      body: payload
    });

    return response;
  },
  fetchAppliedTags: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    contactId: string
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.CONTACTS}/${contactId}/applied_tags`,
    });

    return response;
  },
  removeAppliedTags: async (auth: CLICKFUNNELS_APIKEY_AUTH, tagId: string) => {
    const response = await fireHttpRequest({
      method: HttpMethod.DELETE,
      auth,
      path: `${API_ENDPOINTS.CONTACTS}/applied_tags/${tagId}`,
    });

    return response;
  },
  fetchPipelines: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    workspaceId: string
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}${API_ENDPOINTS.PIPELINES}`,
    });

    return response;
  },
  fetchPipelineStages: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    pipelineId: string
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      auth,
      path: `${API_ENDPOINTS.PIPELINES}/${pipelineId}/stages`,
    });

    return response;
  },
  createOpportunity: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    workspaceId: string,
    payload: any
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.POST,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}/sales/opportunities`,
      body: payload,
    });

    return response;
  },
  createAppliedTag: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    contactId: string,
    payload: any
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.POST,
      auth,
      path: `${API_ENDPOINTS.CONTACTS}/${contactId}/applied_tags`,
      body: payload,
    });

    return response;
  },
  createWebhook: async (
    auth: CLICKFUNNELS_APIKEY_AUTH,
    workspaceId: string,
    payload: any
  ) => {
    const response = await fireHttpRequest({
      method: HttpMethod.POST,
      auth,
      path: `${API_ENDPOINTS.WORKSPACES}/${workspaceId}/webhooks/outgoing/endpoints`,
      body: payload,
    });

    return response;
  },
  deleteWebhook: async (auth: CLICKFUNNELS_APIKEY_AUTH, webhookId: string) => {
    const response = await fireHttpRequest({
      method: HttpMethod.DELETE,
      auth,
      path: `/webhooks/outgoing/endpoints/${webhookId}`,
    });

    return response;
  },
};
