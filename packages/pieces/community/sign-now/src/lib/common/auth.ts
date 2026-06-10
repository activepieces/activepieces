import { PieceAuth, OAuth2AuthorizationMethod, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const signNowOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Sign in with SignNow',
  description: 'Connect your SignNow account using OAuth2. You will be redirected to SignNow to authorize access.',
  authUrl: 'https://app.signnow.com/authorize',
  tokenUrl: 'https://api.signnow.com/oauth2/token',
  required: true,
  scope: ['*'],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  // SignNow does not accept access_type or prompt params — suppress both with empty strings
  extra: { access_type: '' },
  prompt: 'omit',
});

export const signNowApiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'API Key',
  description: `Authenticate using an API key from the SignNow dashboard.

1. Log in to the [SignNow API dashboard](https://app.signnow.com/webapp/developer-experience).
2. Go to **Apps and Keys** and select your application.
3. On the **API Keys** tab, copy your API key.`,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your SignNow API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.signnow.com/user',
        headers: {
          Authorization: `Bearer ${auth.apiKey.trim()}`,
          Accept: 'application/json',
        },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid API key.' };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
});

export const signNowAuth = [signNowOAuth2Auth, signNowApiKeyAuth];

export type SignNowAuthValue = AppConnectionValueForAuthProperty<typeof signNowAuth>;

/**
 * Returns the bearer token for API requests regardless of which auth method was used.
 */
export function getSignNowBearerToken(auth: SignNowAuthValue): string {
  if (auth.type === AppConnectionType.OAUTH2) {
    return auth.access_token;
  }
  return (auth as Extract<SignNowAuthValue, { type: AppConnectionType.CUSTOM_AUTH }>).props.apiKey.trim();
}
