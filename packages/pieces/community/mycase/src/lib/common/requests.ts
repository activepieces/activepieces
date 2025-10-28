import {
  API_ENDPOINTS,
  IMyCaseModel,
  IMyCaseWebhookAction,
  myCaseBaseUrl,
} from './constants';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

async function fireHttpRequest({
  method,
  path,
  body,
  accessToken,
}: {
  method: HttpMethod;
  path: string;
  accessToken: string;
  body?: unknown;
}) {
  return await httpClient
    .sendRequest({
      method,
      url: `${myCaseBaseUrl}${path}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    })
    .then((res) => res.body)
    .catch((err) => {
      throw new Error(
        `Error in request to ${path}: ${err.message || JSON.stringify(err)}`
      );
    });
}

export const myCaseApiService = {
  async createCase({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.CASES}`,
      body: payload,
      accessToken,
    });
  },
  async updateCase({
    accessToken,
    caseId,
    payload,
  }: {
    accessToken: string;
    caseId: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.CASES}/${caseId}`,
      body: payload,
      accessToken,
    });
  },
  async createCall({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.CALLS}`,
      body: payload,
      accessToken,
    });
  },
  async createPerson({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.CLIENTS}`,
      body: payload,
      accessToken,
    });
  },
  async updatePerson({
    accessToken,
    personId,
    payload,
  }: {
    accessToken: string;
    personId: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.CLIENTS}/${personId}`,
      body: payload,
      accessToken,
    });
  },
  async createLead({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.LEADS}`,
      body: payload,
      accessToken,
    });
  },
  async createDocument({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.DOCUMENTS}`,
      body: payload,
      accessToken,
    });
  },
  async createEvent({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.EVENTS}`,
      body: payload,
      accessToken,
    });
  },
  async createCompany({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.COMPANIES}`,
      body: payload,
      accessToken,
    });
  },
  async updateCompany({
    accessToken,
    companyId,
    payload,
  }: {
    accessToken: string;
    companyId: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/v1${API_ENDPOINTS.COMPANIES}/${companyId}`,
      body: payload,
      accessToken,
    });
  },
  async createCustomField({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.CUSTOM_FIELDS}`,
      body: payload,
      accessToken,
    });
  },
  async createCaseStage({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.CASE_STAGES}`,
      body: payload,
      accessToken,
    });
  },
  async createWebhookSubscription({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: {
      model: IMyCaseModel;
      url: string;
      actions: IMyCaseWebhookAction[];
    };
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.WEBHOOKS}/subscriptions`,
      body: payload,
      accessToken,
    });
  },
  async createExpense({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.EXPENSES}`,
      body: payload,
      accessToken,
    });
  },
  async createLocation({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.LOCATIONS}`,
      body: payload,
      accessToken,
    });
  },
  async createCaseNote({
    accessToken,
    caseId,
    payload,
  }: {
    accessToken: string;
    caseId: number;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.CASES}/${caseId}/notes`,
      body: payload,
      accessToken,
    });
  },
  async createClientNote({
    accessToken,
    clientId,
    payload,
  }: {
    accessToken: string;
    clientId: number;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.CLIENTS}/${clientId}/notes`,
      body: payload,
      accessToken,
    });
  },
  async createCompanyNote({
    accessToken,
    companyId,
    payload,
  }: {
    accessToken: string;
    companyId: number;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.COMPANIES}/${companyId}/notes`,
      body: payload,
      accessToken,
    });
  },
  async createPracticeArea({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.PRACTICE_AREAS}`,
      body: payload,
      accessToken,
    });
  },
  async createReferralSource({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.REFERRAL_SOURCES}`,
      body: payload,
      accessToken,
    });
  },
  async createTask({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1/${API_ENDPOINTS.TASKS}`,
      body: payload,
      accessToken,
    });
  },
  async createTimeEntry({
    accessToken,
    payload,
  }: {
    accessToken: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/v1${API_ENDPOINTS.TIME_ENTRIES}`,
      body: payload,
      accessToken,
    });
  },
  async deleteWebhookSubscription({
    accessToken,
    webhookId,
  }: {
    accessToken: string;
    webhookId: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.DELETE,
      path: `/v1${API_ENDPOINTS.WEBHOOKS}/subscriptions/${webhookId}`,
      accessToken,
    });
  },
  async fetchCaseStages({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.CASE_STAGES}${queryString}`,
      accessToken,
    });
  },
  async fetchCases({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.CASES}${queryString}`,
      accessToken,
    });
  },
  async fetchPracticeAreas({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.PRACTICE_AREAS}${queryString}`,
      accessToken,
    });
  },
  async fetchCalls({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.CALLS}${queryString}`,
      accessToken,
    });
  },
  async fetchClients({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.CLIENTS}${queryString}`,
      accessToken,
    });
  },
  async fetchLeads({ accessToken }: { accessToken: string }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.LEADS}`,
      accessToken,
    });
  },
  async fetchCompanies({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.COMPANIES}${queryString}`,
      accessToken,
    });
  },
  async fetchStaffs({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.STAFF}${queryString}`,
      accessToken,
    });
  },
  async fetchLocations({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.LOCATIONS}${queryString}`,
      accessToken,
    });
  },
  async fetchReferralSources({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.REFERRAL_SOURCES}${queryString}`,
      accessToken,
    });
  },
  async fetchPeopleGroups({
    accessToken,
    queryParams,
  }: {
    accessToken: string;
    queryParams?: Record<string, string>;
  }) {
    const queryString = queryParams
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1${API_ENDPOINTS.PEOPLE_GROUPS}${queryString}`,
      accessToken,
    });
  },
};
