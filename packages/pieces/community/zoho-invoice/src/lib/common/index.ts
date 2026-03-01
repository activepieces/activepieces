import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const common = {
  baseUrl: (region: string) => {
    return `https://www.zohoapis.${region}/invoice/v3`;
  },
  authHeaders: (accessToken: string) => {
    return {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    };
  },

  async getInvoices(
    auth: OAuth2PropertyValue,
    search?: {
      createdSince?: string;
    }
  ) {
    const q: {
      last_modified_at?: string;
    } = {};
    if (search?.createdSince) q.last_modified_at = search.createdSince;

    const response = await httpClient.sendRequest({
      url: `${common.baseUrl(auth.props!['region'])}/invoices`,
      method: HttpMethod.GET,
      headers: common.authHeaders(auth.access_token),
      queryParams: q,
    });

    return response.body['invoices'];
  },
};
