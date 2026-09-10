import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { vibeProspectingAuth } from './lib/auth';
import { EXPLORIUM_API_BASE_URL, resolveApiKey } from './lib/common';
import { matchBusinesses } from './lib/actions/match-businesses';
import { matchProspects } from './lib/actions/match-prospects';
import { enrichFirmographics } from './lib/actions/enrich-firmographics';
import { enrichContactsInformation } from './lib/actions/enrich-contacts-information';

export { vibeProspectingAuth };

export const vibeProspecting = createPiece({
  displayName: 'Vibe Prospecting',
  description: 'B2B company and contact intelligence for prospecting workflows.',
  auth: vibeProspectingAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vibe-prospecting.png',
  authors: ['shaharluftig-exp'],
  actions: [
    matchBusinesses,
    matchProspects,
    enrichFirmographics,
    enrichContactsInformation,
    createCustomApiCallAction({
      auth: vibeProspectingAuth,
      baseUrl: () => EXPLORIUM_API_BASE_URL,
      authMapping: async (auth) => ({
        api_key: resolveApiKey(auth),
      }),
    }),
  ],
  triggers: [],
});
