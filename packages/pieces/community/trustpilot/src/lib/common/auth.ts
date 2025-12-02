import { PieceAuth } from '@activepieces/pieces-framework';

export const trustpilotAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://authenticate.trustpilot.com',
  tokenUrl: 'https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken',
  scope: [],
  required: true,
});
