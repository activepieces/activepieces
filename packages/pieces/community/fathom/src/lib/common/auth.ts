import { PieceAuth, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { Fathom } from 'fathom-typescript';

const fathomOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'Sign in with Fathom',
  description: 'Connect your Fathom account using OAuth2.',
  authUrl: 'https://fathom.video/external/v1/oauth2/authorize',
  tokenUrl: 'https://fathom.video/external/v1/oauth2/token',
  required: true,
  scope: ['public_api'],
});

const fathomApiKeyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Fathom API key',
  required: true,
});

export const fathomAuth = [fathomOAuth2Auth, fathomApiKeyAuth];

export function getFathomClient(auth: FathomAuthValue): Fathom {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return new Fathom({ security: { apiKeyAuth: auth.secret_text } });
  }
  return new Fathom({ security: { bearerAuth: auth.access_token } });
}

export type FathomAuthValue = AppConnectionValueForAuthProperty<typeof fathomAuth>;
