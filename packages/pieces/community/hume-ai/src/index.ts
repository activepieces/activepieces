import { createPiece } from '@activepieces/pieces-framework';
import { humeAiAuth } from './lib/common/auth';
import { generateTextToSpeech } from './lib/actions/generate-text-to-speech';
import { generateSpeechFromFile } from './lib/actions/generate-speech-from-file';
import { createVoice } from './lib/actions/create-voice';
import { deleteVoice } from './lib/actions/delete-voice';
import { analyzeEmotionsFromUrl } from './lib/actions/analyze-emotions-from-url';
import { getEmotionResults } from './lib/actions/get-emotion-results';
import { newVoiceTrigger } from './lib/triggers/new-voice';
import { PieceCategory } from '@activepieces/shared';

export const humeAi = createPiece({
  displayName: 'Hume AI',
  auth: humeAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hume-ai.png',
  authors: ['onyedikachi-david'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    generateTextToSpeech,
    generateSpeechFromFile,
    createVoice,
    deleteVoice,
    analyzeEmotionsFromUrl,
    getEmotionResults,
  ],
  triggers: [newVoiceTrigger],
});
