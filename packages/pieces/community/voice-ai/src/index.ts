import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { textToSpeech } from './lib/actions/text-to-speech';
import { speechToText } from './lib/actions/speech-to-text';

export const voiceAi = createPiece({
  displayName: 'Voice AI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/voice-ai.png',
  authors: ['kishanprmr'],
  actions: [textToSpeech, speechToText],
  triggers: [],
});
