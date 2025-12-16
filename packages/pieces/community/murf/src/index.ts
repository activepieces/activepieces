import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { textToSpeech, translate } from './lib/actions';

export const murfAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Murf API key',
  required: true,
});

export const murf = createPiece({
  displayName: 'Murf',
  description: 'AI voice generator for text-to-speech',
  auth: murfAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/murf.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikachi-david'],
  actions: [textToSpeech, translate],
  triggers: [],
});
