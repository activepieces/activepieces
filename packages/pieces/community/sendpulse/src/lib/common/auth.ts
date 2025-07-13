import { PieceAuth, PieceAuthProperty } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';

export const sendPulseAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your SendPulse Client ID and Secret',
  props: {
    client_id: PieceAuthProperty['clientId'](),
    client_secret: PieceAuthProperty['clientSecret'](),
  },
  tokenUrl: 'https://api.sendpulse.com/oauth/access_token',
  authUrl: '',
  scope: [],
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
  required: true,
}); 