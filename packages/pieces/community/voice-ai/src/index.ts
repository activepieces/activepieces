import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { textToSpeech } from './lib/actions/text-to-speech';

export const voiceAi = createPiece({
  displayName: 'Voice-ai',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/voice-ai.png',
  authors: ['kishanprmr'],
  actions: [textToSpeech],
  triggers: [],
});
