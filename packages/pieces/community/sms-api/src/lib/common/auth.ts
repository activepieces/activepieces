import { PieceAuth } from '@activepieces/pieces-framework';

export const SMSAPIAuth = PieceAuth.OAuth2({
  displayName: 'SMSAPI OAuth2',
  description: 'Authenticate with SMSAPI using OAuth2',
  authUrl: 'https://ssl.smsapi.com/oauth/access',
  tokenUrl: 'https://api.smsapi.com/oauth/token',
  required: true,
  scope: ['sms'],
});
