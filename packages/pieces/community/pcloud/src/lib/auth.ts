import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export function getAccessToken(auth: OAuth2PropertyValue): string {
  return auth.access_token;
}

export function getApiUrl(auth: OAuth2PropertyValue): string {
  // pCloud returns API server URL in the OAuth response
  return auth.api_server || 'https://api.pcloud.com';
}
