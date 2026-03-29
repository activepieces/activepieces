import { PieceAuth, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const MEISTERTASK_API_URL = 'https://www.meistertask.com/api';

export const meistertaskAuth = PieceAuth.OAuth2({
  description: 'Authentication for MeisterTask (uses MindMeister OAuth2)',
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  required: true,
  scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
  validate: async ({ auth }) => {
    const accessToken = (auth as OAuth2PropertyValue).access_token;
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${MEISTERTASK_API_URL}/projects`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid token or insufficient scopes.',
      };
    }
  },
});

export const projectId = Property.Dropdown({
  displayName: 'Project',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Connect your account' };

    try {
      const accessToken = (auth as OAuth2PropertyValue).access_token;
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${MEISTERTASK_API_URL}/projects`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      });
      const data = response.body;
      return {
        options: data.map((p: any) => ({ label: p.name, value: p.id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Error loading projects' };
    }
  },
});
