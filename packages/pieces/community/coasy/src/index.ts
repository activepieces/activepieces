import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createFunnelParticipant } from './lib/actions/create-funnel-participant';
import { newFunnelParticipant } from './lib/triggers/new-funnel-participant';
import { newWebinarParticipant } from './lib/triggers/new-webinar-participant';
import { newAuthEvent } from './lib/triggers/new-auth-event';

export const coasyAuth = PieceAuth.CustomAuth({
  required: true,
  description: 'Enter coasy authentication details',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Enter the base URL',
      required: false,
      defaultValue: 'https://backend.api.prod.coasy.io',
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Enter the api key',
      required: true
    })
  },
});

export const coasy = createPiece({
  displayName: 'Coasy',
  auth: coasyAuth,
  description: 'Communicate with Coasy',
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://console.coasy.io/favicon/apple-icon.png',
  authors: ["christian-schab"],
  actions: [createFunnelParticipant],
  triggers: [newFunnelParticipant, newWebinarParticipant, newAuthEvent]
});

