import { PieceAuth } from '@activepieces/pieces-framework';

export const pCloudAuth = PieceAuth.OAuth2({
  description:
    'Connect your pCloud account. Create an app at https://docs.pcloud.com/my_apps/ to get your Client ID and Client Secret.',
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: [],
  extra: {
    // pCloud does not use scopes; all permissions are granted by default.
    // The locationid returned in the OAuth callback tells us whether to use
    // api.pcloud.com (US, locationid=1) or eapi.pcloud.com (EU, locationid=2).
  },
});

/**
 * Returns the correct pCloud API hostname based on the OAuth2 response.
 * pCloud splits its infrastructure by region:
 *   locationid 1  ->  api.pcloud.com   (US servers)
 *   locationid 2  ->  eapi.pcloud.com  (EU servers)
 *
 * The locationid is included in the token exchange response alongside the
 * access_token.  We store it as a custom property on the auth object via the
 * `extra` field so individual actions can resolve the correct base URL.
 *
 * If locationid is missing we fall back to the US endpoint.
 */
export function getPCloudBaseUrl(auth: { data?: Record<string, unknown> }): string {
  const locationId = (auth.data as Record<string, unknown> | undefined)?.['locationid'];
  if (locationId === 2 || locationId === '2') {
    return 'https://eapi.pcloud.com';
  }
  return 'https://api.pcloud.com';
}
