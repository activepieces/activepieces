import {
  OAuth2PropertyValue,
  createPiece,
} from '@activepieces/pieces-framework';
import actions from './lib/actions';
import triggers from './lib/triggers';
import { spotifyCommon } from './lib/common';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const spotify = createPiece({
  displayName: 'Spotify',
  auth: spotifyCommon.authentication,
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/spotify.png',
  authors: ['JanHolger'],
  actions: [
    ...actions,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.spotify.com/v1',
      auth: spotifyCommon.authentication,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers,
});
