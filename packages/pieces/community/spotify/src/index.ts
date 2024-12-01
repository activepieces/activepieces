import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  createPiece,
} from '@activepieces/pieces-framework';
import actions from './lib/actions';
import { spotifyCommon } from './lib/common';
import triggers from './lib/triggers';

export const spotify = createPiece({
  displayName: 'Spotify',
  description: 'Music for everyone',

  auth: spotifyCommon.authentication,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/spotify.png',
  categories: [],
  authors: ["JanHolger","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    ...actions,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.spotify.com/v1',
      auth: spotifyCommon.authentication,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers,
});
