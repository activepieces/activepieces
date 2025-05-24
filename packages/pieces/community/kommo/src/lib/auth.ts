import { OAuth2PropertyValue, PieceAuth, Property } from '@activepieces/pieces-framework';
import { KOMMO_OAUTH_URLS } from './common';

export const kommoAuth = PieceAuth.OAuth2({
  description: 'OAuth2 authentication for Kommo',
  authUrl: KOMMO_OAUTH_URLS.authorizeUrl,
  tokenUrl: 'https://{subdomain}.kommo.com/oauth2/access_token',

  required: true,
  scope: [],
  props: {
    subdomain: Property.ShortText({
      displayName: 'Subdomain',
      description: 'Your Kommo subdomain (e.g., "mycompany" for mycompany.kommo.com)',
      required: true,
    }),
  },

});

export function getAccessTokenOrThrow(auth: OAuth2PropertyValue) {
  if (!auth.access_token) {
    throw new Error('Access token is required');
  }
  return auth.access_token;
}

export function getSubdomainOrThrow(auth: OAuth2PropertyValue) {
  const subdomain = auth.props?.subdomain;
  if (!subdomain) {
    throw new Error('Subdomain is required');
  }
  return subdomain;
}

export function getApiUrl(auth: OAuth2PropertyValue, endpoint: string) {
  const subdomain = getSubdomainOrThrow(auth);
  return `https://${subdomain}.kommo.com/api/v4/${endpoint}`;
}

export function getTokenUrl(auth: OAuth2PropertyValue) {
  const subdomain = getSubdomainOrThrow(auth);
  return `https://${subdomain}.kommo.com/oauth2/access_token`;
}
