import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { chatGemini } from './lib/actions/chat-gemini.action';
import { createVideoAction } from './lib/actions/create-video.action';
import { generateContentFromImageAction } from './lib/actions/generate-content-from-image.action';
import { generateContentAction } from './lib/actions/generate-content.action';
import { textToSpeechAction } from './lib/actions/text-to-speech.action';
import { generateContentWithFileSearchAction } from './lib/actions/generate-content-with-file-search';
import { googleGeminiAuth } from './lib/auth';

export const googleGemini = createPiece({
  displayName: 'Google Gemini',
  auth: googleGeminiAuth,
  description: 'Use the new Gemini models from Google',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-gemini.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["pfernandez98","kishanprmr","MoShizzle","AbdulTheActivePiecer","abuaboud"],
  actions: [
    generateContentAction,
    generateContentWithFileSearchAction,
    generateContentFromImageAction,
    chatGemini,
    textToSpeechAction,
    createVideoAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://generativelanguage.googleapis.com/v1beta',
      auth: googleGeminiAuth,
      authMapping: async (auth) => ({ key: auth.secret_text }),
      authLocation: 'queryParams',
    }),
  ],
  triggers: [],
});
