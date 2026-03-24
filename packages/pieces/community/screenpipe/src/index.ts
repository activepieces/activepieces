import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { searchContent } from './lib/actions/search-content';
import { getRecentContext } from './lib/actions/get-recent-context';
import { getAudioTranscription } from './lib/actions/get-audio-transcription';
import { checkHealth } from './lib/actions/check-health';

export const screenpipeAuth = PieceAuth.CustomAuth({
  description: `
  Configure your Screenpipe server connection.

  1. Make sure Screenpipe is running on your machine.
  2. The default server URL is \`http://localhost:3030\`.
  3. Change the URL if your Screenpipe instance runs on a different host or port.
  `,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Screenpipe server URL (e.g. http://localhost:3030)',
      required: true,
      defaultValue: 'http://localhost:3030',
    }),
  },
  required: true,
});

export const screenpipe = createPiece({
  displayName: 'Screenpipe',
  description: '24/7 local screen & audio capture with AI-powered search',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/screenpipe.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS],
  auth: screenpipeAuth,
  authors: ['Harmatta'],
  actions: [
    searchContent,
    getRecentContext,
    getAudioTranscription,
    checkHealth,
    createCustomApiCallAction({
      baseUrl: (auth) => ((auth as { props?: { base_url?: string } } | undefined)?.props?.base_url ?? '').replace(/\/$/, ''),
      auth: screenpipeAuth,
      authMapping: async () => ({}),
    }),
  ],
  triggers: [],
});
