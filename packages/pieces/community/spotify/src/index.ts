import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import actions from './lib/actions';
import { spotifyCommon } from './lib/common';
import triggers from './lib/triggers';

export const spotify = createPiece({
  displayName: 'Spotify',
  description: 'Music for everyone',
  auth: spotifyCommon.authentication,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/spotify.png',
  categories: [],
  authors: [
    'JanHolger',
    'kishanprmr',
    'MoShizzle',
    'abuaboud',
    'jerboa88',
    'Jarva',
    'OdaiAhmed99',
  ],
  actions: [
    ...actions,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.spotify.com/v1',
      props: {
        url: {
          description: 'Full URL, or a path relative to https://api.spotify.com/v1',
          placeholder: '/me/playlists',
        },
      },
      auth: spotifyCommon.authentication,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers,
});
