import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { customApiCall } from './lib/actions/custom-api-call';
import { detectLanguage } from './lib/actions/detect-language';
import { listLanguages } from './lib/actions/list-languages';
import { translateText } from './lib/actions/translate-text';
import { googleTranslateAuth } from './lib/auth';

export const googleTranslate = createPiece({
  displayName: 'Google Translate',
  description: 'Translate text and detect languages with Google Cloud Translation.',
  auth: googleTranslateAuth,
  minimumSupportedRelease: '0.88.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-translate.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['fabio-kozlowski'],
  actions: [translateText, detectLanguage, listLanguages, customApiCall],
  triggers: [],
});
