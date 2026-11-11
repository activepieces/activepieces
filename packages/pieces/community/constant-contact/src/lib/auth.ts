import { PieceAuth } from '@activepieces/pieces-framework';

export const constantContactAuth = PieceAuth.OAuth2({
  description:
    'Sign in to Constant Contact and allow access to contacts, email campaigns and account sender addresses. Connections created before version 0.4.0 of this piece must be reconnected to use the campaign and sender-address actions.',
  required: true,
  tokenUrl: 'https://authz.constantcontact.com/oauth2/default/v1/token',
  authUrl: 'https://authz.constantcontact.com/oauth2/default/v1/authorize',
  scope: ['contact_data', 'campaign_data', 'account_read', 'offline_access'],
});
