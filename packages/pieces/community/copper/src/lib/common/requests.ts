import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { API_ENDPOINTS, BASE_URL, CopperAuthType } from './constants';

async function fireHttpRequest({
  method,
  path,
  auth,
  body,
}: {
  method: HttpMethod;
  path: string;
  auth: CopperAuthType;
  body?: any;
}) {
  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-PW-AccessToken': auth.apiKey,
        'X-PW-Application': 'developer_api',
        'X-PW-UserEmail': auth.email,
      },
      body,
    })
    .then((res) => res.body)
    .catch((err) => {
      throw err;
    });
}

export const CopperApiService = {
  async fetchCurrentUser(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.USERS}/me`,
      auth,
    });
  },
  async fetchLeads(auth: CopperAuthType, payload?: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.LEADS}/search`,
      auth,
      body: payload
    });
  },
  async createTask(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.TASKS}`,
      auth,
      body: payload,
    });
  },
  async createProject(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.PROJECTS}`,
      auth,
      body: payload,
    });
  },
  async updateProject(auth: CopperAuthType, projectId: string, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.PROJECTS}/${projectId}`,
      auth,
      body: payload,
    });
  },
  async fetchProjects(auth: CopperAuthType, payload?: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.PROJECTS}/search`,
      auth,
      body: payload
    });
  },
  async createCompany(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.COMPANIES}`,
      auth,
      body: payload,
    });
  },
  async updateCompany(auth: CopperAuthType, companyId: string, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.COMPANIES}/${companyId}`,
      auth,
      body: payload,
    });
  },
  async fetchCompanies(auth: CopperAuthType, payload?: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.COMPANIES}/search`,
      auth,
      body: payload
    });
  },
  async fetchActivityTypes(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/activity_types`,
      auth,
    });
  },
  async fetchContactTypes(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/contact_types`,
      auth,
    });
  },
  async fetchLeadStatuses(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/lead_statuses`,
      auth,
    });
  },
  async fetchCustomerSources(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/customer_sources`,
      auth,
    });
  },
  async fetchLossReasons(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/loss_reasons`,
      auth,
    });
  },
  async createActivity(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1/activities`,
      auth,
      body: payload,
    });
  },
  async fetchActivities(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1/activities/search`,
      auth,
      body: payload,
    });
  },
  async createOpportunity(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.OPPORTUNITIES}`,
      auth,
      body: payload,
    });
  },
  async updateOpportunity(
    auth: CopperAuthType,
    opportunityId: string,
    payload: any
  ) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
      auth,
      body: payload,
    });
  },
  async fetchOpportunities(auth: CopperAuthType, payload?: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.OPPORTUNITIES}/search`,
      auth,
      body: payload
    });
  },
  async fetchTasks(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.TASKS}/search`,
      auth,
    });
  },
  async fetchPipelines(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.PIPELINES}`,
      auth,
    });
  },
  async createLead(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.LEADS}`,
      auth,
      body: payload,
    });
  },
  async updateLead(auth: CopperAuthType, leadId: string, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.LEADS}/${leadId}`,
      auth,
      body: payload,
    });
  },
  async convertLead(auth: CopperAuthType, leadId: string, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.LEADS}/${leadId}/convert`,
      auth,
      body: payload,
    });
  },
  async createPerson(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.PEOPLE}`,
      auth,
      body: payload,
    });
  },
  async updatePerson(auth: CopperAuthType, personId: string, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.PEOPLE}/${personId}`,
      auth,
      body: payload,
    });
  },
  async fetchPeople(auth: CopperAuthType, payload?: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.PEOPLE}/search`,
      auth,
      body: payload
    });
  },
  async fetchUsers(auth: CopperAuthType) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.USERS}/search`,
      auth,
    });
  },
  async createWebhook(auth: CopperAuthType, payload: any) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.WEBHOOKS}`,
      auth,
      body: payload,
    });
  },
  async deleteWebhook(auth: CopperAuthType, webhookId: string) {
    return await fireHttpRequest({
      method: HttpMethod.DELETE,
      path: `/v1${API_ENDPOINTS.WEBHOOKS}/${webhookId}`,
      auth,
    });
  },
};
