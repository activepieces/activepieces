import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const zohoDeskCommon = {
  baseUrl: (auth: any) => {
    const data = (auth as OAuth2PropertyValue).data;
    return data && data['api_domain']? `${data['api_domain']}/api/v1` : '';
  },
  authHeaders: (accessToken: string, orgId: string) => {
    return {
        orgId:  orgId,
        Authorization: `Zoho-oauthtoken ${accessToken}`
      };
  },
};
