import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { deepgramAuth } from './common/auth';
import { createSummary } from './actions/create-summary';
import { transcribeAudio } from './actions/transcribe-audio';
import { createTranscription } from './actions/create-transcription';
import { listProjects } from './actions/list-projects';
import { textToSpeech } from './actions/text-to-speech';

export const deepgram = createPiece({
  displayName: 'Deepgram',
  description: 'Cutting-edge speech recognition platform with real-time and batch transcription, text-to-speech, and voice AI capabilities',
  auth: deepgramAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/deepgram.png',
  authors: ['activepieces'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    createSummary,
    transcribeAudio,
    createTranscription,
    listProjects,
    textToSpeech,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.deepgram.com/v1',
      auth: deepgramAuth,
      authMapping: async (auth) => ({
        Authorization: `Token ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
