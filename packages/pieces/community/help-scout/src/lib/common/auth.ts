import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const helpScoutAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Help Scout account using OAuth2.',
  required: true,
  authUrl: 'https://secure.helpscout.net/authentication/authorizeClientApplication',
  tokenUrl: 'https://api.helpscout.net/v2/oauth2/token',
  scope: [], // Help Scout does not require a scope parameter for OAuth2
  props: {
    client_id: Property.ShortText({
      displayName: 'Client ID',
      required: true,
      description: 'Your Help Scout OAuth2 application Client ID.'
    }),
    client_secret: Property.ShortText({
      displayName: 'Client Secret',
      required: true,
      description: 'Your Help Scout OAuth2 application Client Secret.'
    })
  }
}); 