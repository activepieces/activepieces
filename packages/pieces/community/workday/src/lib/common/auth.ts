import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const workdayAuth = PieceAuth.OAuth2({
  description: '',
  props: {
    hostname: Property.ShortText({
      displayName: 'Hostname',
      required: true,
      description:
        "Your Workday hostname (e.g., 'mycompany' if your Workday URL is 'https://mycompany.workday.com')",
    }),
    tenant: Property.ShortText({
      displayName: 'Tenant',
      required: true,
      description:
        'Tenant ID. This can be located in your account URL address as follows: https://HostName.workday.com/TenantID/d/home/html.',
    }),
    auth_Url: Property.ShortText({
      displayName: 'Authorization Endpoint URL',
      required: true,
      description:
        "The URL for obtaining the authorization code (e.g., 'https://auth.workday.com/authorize')",
    }),
    tokenUrl: Property.ShortText({
      displayName: 'Token Endpoint URL',
      required: true,
      description:
        "The URL for exchanging the authorization code for an access token (e.g., 'https://auth.workday.com/token')",
    }),
  },
  authUrl: '{auth_Url}',
  tokenUrl: '{tokenUrl}',
  required: true,
  scope: ['openid'],
});
