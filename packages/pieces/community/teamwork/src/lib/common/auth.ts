import { PieceAuth} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const teamworkAuth = PieceAuth.SecretText({
  displayName: 'Teamwork API Token',
  description: 'Enter your Teamwork Personal API Token.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const siteName = (
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://www.teamwork.com/launchpad/v1/auth/me',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth,
          },
        })
      ).body['installedAccounts'][0]['siteName'];

      if (!siteName) {
        throw new Error('Could not find siteName.');
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://${siteName}.teamwork.com/projects/api/v3/projects.json?page=1&pageSize=1`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: `Could not validate token, status: ${response.status}`,
      };
    } catch (e) {
      return {
        valid: false,
        error: `Authentication failed: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
      };
    }
  },
});
