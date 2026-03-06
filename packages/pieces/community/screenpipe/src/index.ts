import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { screenpipeAuth } from './lib/auth';
import { searchContent } from './lib/actions/search-content';
import { healthCheck } from './lib/actions/health-check';
import { addTags } from './lib/actions/add-tags';
import { listAudioDevices } from './lib/actions/list-audio-devices';
import { listMonitors } from './lib/actions/list-monitors';
import { newContent } from './lib/triggers/new-content';

export const screenpipe = createPiece({
  displayName: 'Screenpipe',
  description:
    'Local screen and audio capture with OCR and transcription for personal AI memory',
  auth: screenpipeAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/screenpipe.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: [],
  actions: [
    searchContent,
    healthCheck,
    addTags,
    listAudioDevices,
    listMonitors,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const spAuth = auth as { baseUrl: string };
        return spAuth.baseUrl.replace(/\/$/, '');
      },
      auth: screenpipeAuth,
      authMapping: async () => ({}),
    }),
  ],
  triggers: [newContent],
});
