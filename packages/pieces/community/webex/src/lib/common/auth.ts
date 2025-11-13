import { PieceAuth } from '@activepieces/pieces-framework';

export const webexAuth = PieceAuth.OAuth2({
  description: 'Connect your Webex account',
  authUrl: 'https://webexapis.com/v1/authorize',
  tokenUrl: 'https://webexapis.com/v1/access_token',
  required: true,
  scope: [
    'spark-compliance:messages_write',
    'spark-compliance:messages_read',
    'spark:messages_write',
    'spark:messages_read',
    'spark-compliance:rooms_write',
    'spark-compliance:rooms_read',
    'spark-compliance:teams_read',
    'spark:rooms_write',
    'spark:rooms_read'
  ],
});
