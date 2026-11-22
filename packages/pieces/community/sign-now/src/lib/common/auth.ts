import { PieceAuth, OAuth2AuthorizationMethod, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { SignNowApiError, signNowClient, signNowData } from './client';

export const signNowOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Sign in with SignNow',
  description: 'Connect your SignNow account by signing in to SignNow.',
  authUrl: 'https://app.signnow.com/authorize',
  tokenUrl: 'https://api.signnow.com/oauth2/token',
  required: true,
  scope: ['*'],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  extra: { access_type: '' },
  prompt: 'omit',
  getConnectionIdentifier: async ({ auth }) => fetchSignNowUserLabel({ token: auth.access_token }),
});

export const signNowApiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'API Key',
  description: 'Copy the API key from Apps and Keys in your SignNow API dashboard.',
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
      await signNowClient.getUser({ token: auth.apiKey, timeoutMs: VALIDATE_TIMEOUT_MS });
      return { valid: true };
    } catch (error) {
      if (error instanceof SignNowApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'SignNow did not recognise this API key.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach SignNow.' };
    }
  },
  getConnectionIdentifier: async ({ auth }) => fetchSignNowUserLabel({ token: auth.apiKey ?? '' }),
});

export const signNowAuth = [signNowOAuth2Auth, signNowApiKeyAuth];

export function getSignNowBearerToken(auth: SignNowAuthValue): string {
  if (auth.type === AppConnectionType.OAUTH2) {
    return auth.access_token;
  }
  return auth.props.apiKey.trim();
}

async function fetchSignNowUserLabel({ token }: { token: string }): Promise<string | undefined> {
  try {
    const user = await signNowClient.getUser({ token, timeoutMs: VALIDATE_TIMEOUT_MS });
    const fullName = [signNowData.textAt({ value: user, key: 'first_name' }), signNowData.textAt({ value: user, key: 'last_name' })]
      .filter(Boolean)
      .join(' ');
    const emails = signNowData.stringList(user['emails']);
    return signNowData.textAt({ value: user, key: 'primary_email' }) || emails[0] || fullName || undefined;
  } catch {
    return undefined;
  }
}

const VALIDATE_TIMEOUT_MS = 5000;

export type SignNowAuthValue = AppConnectionValueForAuthProperty<typeof signNowAuth>;
