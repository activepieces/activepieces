import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { WhatConvertsAuth } from './auth';
import {
  CreateExportParams,
  CreateLeadParams,
  FindLeadParams,
  LeadsResponse,
  Profile,
  ProfilesResponse,
  UpdateLeadParams,
  AccountsResponse,
  Account,
} from './types';

const WHATCONVERTS_API_URL = 'https://app.whatconverts.com/api/v1';

export const whatConvertsClient = {
  async getAccounts(auth: WhatConvertsAuth): Promise<Account[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${WHATCONVERTS_API_URL}/accounts`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
    };
    const response = await httpClient.sendRequest<AccountsResponse>(request);
    return response.body.accounts;
  },

  async getProfiles(
    auth: WhatConvertsAuth,
    accountId: number
  ): Promise<Profile[]> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${WHATCONVERTS_API_URL}/accounts/${accountId}/profiles`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
    };
    const response = await httpClient.sendRequest<ProfilesResponse>(request);
    return response.body.profiles;
  },

  async createLead(
    auth: WhatConvertsAuth,
    accountId: number, 
    params: CreateLeadParams
  ) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/accounts/${accountId}/leads`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
      body: params,
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async findLeads(
    auth: WhatConvertsAuth,
    params: FindLeadParams
  ): Promise<LeadsResponse> {
    const queryParams: QueryParams = {};
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof FindLeadParams];
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = value.toString();
      }
    });

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${WHATCONVERTS_API_URL}/leads`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
      queryParams: queryParams,
    };
    const response = await httpClient.sendRequest<LeadsResponse>(request);
    return response.body;
  },

  async createExport(auth: WhatConvertsAuth, params: CreateExportParams) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/exports`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
      body: params,
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async updateLead(
    auth: WhatConvertsAuth,
    leadId: number,
    params: UpdateLeadParams
  ) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/leads/${leadId}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
      body: params,
    };
    const response = await httpClient.sendRequest(request);
    return response.body;
  },

  async subscribeWebhook(
    auth: WhatConvertsAuth,
    event: string,
    targetUrl: string
  ) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/webhooks/subscribe`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
      body: {
        event: event,
        target_url: targetUrl,
      },
    };
    return await httpClient.sendRequest(request);
  },

  async unsubscribeWebhook(auth: WhatConvertsAuth, targetUrl: string) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/webhooks/unsubscribe`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret,
      },
      body: {
        target_url: targetUrl,
      },
    };
    return await httpClient.sendRequest(request);
  },
};
