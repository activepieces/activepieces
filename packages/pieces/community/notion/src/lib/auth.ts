import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  OAuth2AuthorizationMethod,
  PieceAuth,
} from '@activepieces/pieces-framework';

export const notionOAuth2Auth = PieceAuth.OAuth2({
  authUrl: 'https://api.notion.com/v1/oauth/authorize',
  tokenUrl: 'https://api.notion.com/v1/oauth/token',
  scope: [],
  extra: {
    owner: 'user',
  },
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  required: true,
});

const notionCustomAuth = PieceAuth.CustomAuth({
  displayName: 'Access Token',
  description: `1. Open [My integrations](https://www.notion.so/my-integrations) and create an internal integration.
2. Copy its Internal Integration Secret and paste it below.
3. In Notion, open each page or database you want to use and share it with the integration.`,
  required: true,
  props: {
    accessToken: PieceAuth.SecretText({
      displayName: 'Internal Integration Secret',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.notion.com/v1/users/me',
        headers: {
          'Notion-Version': '2022-02-22',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.accessToken,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
});

export const notionAuth = [notionOAuth2Auth, notionCustomAuth];
