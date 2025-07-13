import { PieceAuth } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';

export const sendPulseAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your SendPulse Client ID and Secret',
  authUrl: '',
  tokenUrl: 'https://api.sendpulse.com/oauth/access_token',
  required: true,
  scope: [],
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
}); 