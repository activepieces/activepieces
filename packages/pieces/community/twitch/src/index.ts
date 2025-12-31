import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { streamStarted } from './lib/triggers/stream-started';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const twitchAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your twitch account',
  authUrl: 'https://id.twitch.tv/oauth2/authorize',
  tokenUrl: 'https://id.twitch.tv/oauth2/token',
  required: true,
  scope: [],
});
export const twitch = createPiece({
  displayName: 'Twitch',
  auth: twitchAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/twitch.png',
  authors: ['arinmakk', 'sanket-a11y'],
  description:
    "Twitch is the world's leading live streaming platform for gamers and the things we love!",
  actions: [
    createCustomApiCallAction({
      auth: twitchAuth,
      baseUrl: () => `https://api.twitch.tv/helix`,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          'Client-ID': auth.client_id,
        };
      },
    }),
  ],
  triggers: [streamStarted],
});
