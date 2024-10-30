import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { textToSpeech } from './lib/actions/text-to-speech';
import { speechToText } from './lib/actions/speech-to-text';
import { PieceCategory } from '@activepieces/shared';

export const voiceAi = createPiece({
  displayName: 'Voice AI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.34.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/voice-ai.svg',
  authors: ['kishanprmr'],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  actions: [textToSpeech, speechToText],
  triggers: [],
});
