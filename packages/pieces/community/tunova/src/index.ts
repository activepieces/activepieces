import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { tunovaAuth } from './lib/common/auth';
import { generateSong } from './lib/actions/generate-song';
import { getJob } from './lib/actions/get-job';
import { generateLyrics } from './lib/actions/generate-lyrics';

export { tunovaAuth };

export const tunova = createPiece({
  displayName: 'Tunova',
  description:
    'Generate music with Suno (v5.5) via the Tunova API — REST + MCP, async, billed only on successful renders (a failed render auto-refunds).',
  auth: tunovaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://tunova.ai/icon.svg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
  authors: ['erliona'],
  actions: [
    generateSong,
    getJob,
    generateLyrics,
    createCustomApiCallAction({
      auth: tunovaAuth,
      baseUrl: () => 'https://api.tunova.ai',
      authMapping: async (auth) => ({
        'X-API-Key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
