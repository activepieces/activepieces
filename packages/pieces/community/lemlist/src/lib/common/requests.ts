import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { API_ENDPOINTS, BASE_URL } from './constants';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { lemlistAuth } from './constants';

async function fireHttpRequest({
  method,
  path,
  auth,
  body,
}: {
  method: HttpMethod;
  path: string;
  auth: string;
  body?: unknown;
}) {
  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
      authentication: {
        type: AuthenticationType.BASIC,
        username: '',
        password: auth,
      },
    })
    .then((res) => res.body);
}

export const lemlistApiService = {
  async fetchTeams(auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>) {
    return await fireHttpRequest({
      path: `${API_ENDPOINTS.TEAM}`,
      method: HttpMethod.GET,
      auth: auth.secret_text,
    });
  },
  async getLeadByEmail(auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>, email: string) {
    return await fireHttpRequest({
      path: `${API_ENDPOINTS.LEADS}/${email}?version=v2`,
      method: HttpMethod.GET,
      auth: auth.secret_text,
    });
  },
  async fetchCampaigns(auth: string) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.CAMPAIGNS}?version=v2&sortBy=createdAt&sortOrder=desc`,
      method: HttpMethod.GET,
      auth,
    });
    return response.campaigns;
  },
  async removeLeadFromACampaign(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { campaignId, leadEmail }: { campaignId: string; leadEmail: string }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.CAMPAIGNS}/${campaignId}${API_ENDPOINTS.LEADS}/${leadEmail}?action=remove`,
      method: HttpMethod.DELETE,
      auth: auth.secret_text,
    });
    return response;
  },
  async addLeadToACampaign(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    {
      campaignId,
      leadEmail,
      leadData,
      deduplicate,
      linkedinEnrichment,
      findEmail,
      verifyEmail,
      findPhone,
    }: {
      campaignId: string;
      leadEmail: string;
      leadData?: Record<string, unknown>;
      deduplicate?: boolean;
      linkedinEnrichment?: boolean;
      findEmail?: boolean;
      verifyEmail?: boolean;
      findPhone?: boolean;
    }
  ) {
    const queryParams = new URLSearchParams();
    if (deduplicate) queryParams.append('deduplicate', 'true');
    if (linkedinEnrichment) queryParams.append('linkedinEnrichment', 'true');
    if (findEmail) queryParams.append('findEmail', 'true');
    if (verifyEmail) queryParams.append('verifyEmail', 'true');
    if (findPhone) queryParams.append('findPhone', 'true');

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.CAMPAIGNS}/${campaignId}${API_ENDPOINTS.LEADS}/${leadEmail}${query}`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
      body: leadData,
    });

    return response;
  },
  async updateLeadFromCampaign(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    {
      campaignId,
      leadEmail,
      leadData,
    }: {
      campaignId: string;
      leadEmail: string;
      leadData?: Record<string, unknown>;
    }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.CAMPAIGNS}/${campaignId}${API_ENDPOINTS.LEADS}/${leadEmail}`,
      method: HttpMethod.PATCH,
      auth: auth.secret_text,
      body: leadData,
    });

    return response;
  },
  async unsubscribeLeadFromACampaign(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { campaignId, leadEmail }: { campaignId: string; leadEmail: string }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.CAMPAIGNS}/${campaignId}${API_ENDPOINTS.LEADS}/${leadEmail}`,
      method: HttpMethod.DELETE,
      auth: auth.secret_text,
    });
    return response;
  },
  async markLeadAsInterestedInCampaign(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { campaignId, leadEmail }: { campaignId: string; leadEmail: string }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.CAMPAIGNS}/${campaignId}${API_ENDPOINTS.LEADS}/${leadEmail}/interested`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
    });
    return response;
  },
  async markLeadAsInterestedInAllCampaigns(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { leadEmail }: { leadEmail: string }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.LEADS}/interested/${leadEmail}`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
    });
    return response;
  },
  async markLeadAsNotInterestedInAllCampaigns(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { leadEmail }: { leadEmail: string }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.LEADS}/notinterested/${leadEmail}`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
    });
    return response;
  },
  async markLeadAsNotInterestedInCampaign(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { campaignId, leadEmail }: { campaignId: string; leadEmail: string }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.CAMPAIGNS}/${campaignId}${API_ENDPOINTS.LEADS}/${leadEmail}/notinterested`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
    });
    return response;
  },
  async pauseLeadInSpecificOrAllCampaigns(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { campaignId, leadEmail }: { campaignId?: string; leadEmail: string }
  ) {
    const query = campaignId ? `?campaignId=${campaignId}` : '';

    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.LEADS}/pause/${leadEmail}${query}`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
    });

    return response;
  },
  async resumeLeadInSpecificOrAllCampaigns(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { campaignId, leadEmail }: { campaignId?: string; leadEmail: string }
  ) {
    const query = campaignId ? `?campaignId=${campaignId}` : '';

    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.LEADS}/start/${leadEmail}${query}`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
    });

    return response;
  },
  async removeLeadFromUnsubscribeList(
    auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>,
    { leadEmail }: { leadEmail: string }
  ) {
    const response = await fireHttpRequest({
      path: `${API_ENDPOINTS.UNSUBSCRIBES}/${leadEmail}`,
      method: HttpMethod.DELETE,
      auth: auth.secret_text,
    });

    return response;
  },
  async createWebhook(auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>, payload: any) {
    return await fireHttpRequest({
      path: `${API_ENDPOINTS.HOOKS}`,
      method: HttpMethod.POST,
      auth: auth.secret_text,
      body: payload,
    });
  },
  async deleteWebhook(auth: AppConnectionValueForAuthProperty<typeof lemlistAuth>, webhookId: string) {
    return await fireHttpRequest({
      path: `${API_ENDPOINTS.HOOKS}/${webhookId}`,
      method: HttpMethod.DELETE,
      auth: auth.secret_text,
    });
  },
};
