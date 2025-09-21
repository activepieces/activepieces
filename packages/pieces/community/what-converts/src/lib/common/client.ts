import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { BasicAuthPropertyValue } from '@activepieces/pieces-framework';

const BASE_URL = 'https://app.whatconverts.com/api/v1';

async function makeRequest<T extends object>(
  auth: BasicAuthPropertyValue,
  request: Omit<HttpRequest, 'url' | 'authentication'> & { url: string }
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    ...request,
    url: `${BASE_URL}${request.url}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.username,
      password: auth.password,
    },
  });
  return response.body;
}

export const whatConvertsClient = {
  getLeads: async (
    auth: BasicAuthPropertyValue,
    params?: QueryParams
  ): Promise<{ leads: any[] }> => {
    return makeRequest(auth, {
      method: HttpMethod.GET,
      url: '/leads',
      queryParams: params,
    });
  },

  /**
   * Retrieves a single lead by its ID.
   * @param auth The user's authentication credentials.
   * @param leadId The ID of the lead to retrieve.
   */
  getLead: async (
    auth: BasicAuthPropertyValue,
    leadId: number,
    params?: QueryParams
  ) => {
    return makeRequest(auth, {
        method: HttpMethod.GET,
        url: `/leads/${leadId}`,
        queryParams: params,
    });
  },

  getProfiles: async (auth: BasicAuthPropertyValue): Promise<{ profiles: any[] }> => {
    return makeRequest(auth, {
      method: HttpMethod.GET,
      url: '/profiles',
    });
  },

  createLead: async (
    auth: BasicAuthPropertyValue,
    payload: Record<string, unknown>
  ) => {
    return makeRequest(auth, {
      method: HttpMethod.POST,
      url: '/leads',
      body: payload,
    });
  },

  updateLead: async (
    auth: BasicAuthPropertyValue,
    leadId: number,
    payload: Record<string, unknown>
  ) => {
    return makeRequest(auth, {
      method: HttpMethod.POST,
      url: `/leads/${leadId}`,
      body: payload,
    });
  },
};