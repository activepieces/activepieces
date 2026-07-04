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
  description:
    'Connect using a Notion Internal Integration Token. Create one at https://www.notion.so/my-integrations.',
  required: true,
  props: {
    accessToken: PieceAuth.SecretText({
      displayName: 'Internal Integration Token',
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
