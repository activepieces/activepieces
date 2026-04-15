import { PieceAuth } from '@activepieces/pieces-framework';

export const webexAuth = PieceAuth.OAuth2({
  description: 'Connect your Webex account',
  authUrl: 'https://webexapis.com/v1/authorize',
  tokenUrl: 'https://webexapis.com/v1/access_token',
  required: true,
  scope: ['spark:all', 'meeting:schedules_read'],
});
