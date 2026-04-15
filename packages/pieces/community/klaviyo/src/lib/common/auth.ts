import {
  AppConnectionValueForAuthProperty,
  OAuth2AuthorizationMethod,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

export const klaviyoAuth = [
  PieceAuth.SecretText({
    displayName: 'Private API Key',
    description: `Authenticate using your Klaviyo Private API Key.\n\n**Steps:**\n1. Log in to Klaviyo → go to **Settings → API Keys**\n2. Click **Create Private API Key**\n3. Give it a name and select the required scopes\n4. Copy the key (starts with \`pk_\`) and paste it below`,
    required: true,
    validate: async ({ auth }) => {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://a.klaviyo.com/api/accounts',
          headers: {
            Authorization: `Klaviyo-API-Key ${auth}`,
            revision: '2025-04-15',
            accept: 'application/vnd.api+json',
          },
        });
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error:
            'Invalid Private API Key. Check your key in Klaviyo → Settings → API Keys.',
        };
      }
    },
  }),
  PieceAuth.OAuth2({
    description: `
To connect via OAuth2, follow the [Klaviyo OAuth setup guide](https://developers.klaviyo.com/en/docs/set_up_oauth) to register your app, then set the **Redirect URI** to {{redirectUrl}} and enable the following **scopes** in your app settings:
  - profiles:read
  - profiles:write
  - lists:read
  - lists:write
  - tags:read
  - segments:read
  - events:read
  - events:write
  - subscriptions:read
  - subscriptions:write
  - accounts:read`,
    authUrl: 'https://www.klaviyo.com/oauth/authorize',
    tokenUrl: 'https://a.klaviyo.com/oauth/token',
    required: true,
    scope: [
      'profiles:read',
      'profiles:write',
      'lists:read',
      'lists:write',
      'tags:read',
      'segments:read',
      'events:read',
      'events:write',
      'subscriptions:read',
      'subscriptions:write',
      'accounts:read',
    ],
    pkce: true,
    pkceMethod: 'S256',
    authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  }),
];

export type KlaviyoAuthValue = AppConnectionValueForAuthProperty<
  typeof klaviyoAuth
>;

export function getAuthorizationHeader(auth: KlaviyoAuthValue): string {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return `Klaviyo-API-Key ${auth.secret_text}`;
  }
  return `Bearer ${auth.access_token}`;
}
