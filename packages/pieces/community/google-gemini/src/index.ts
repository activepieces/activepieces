import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { chatGemini } from './lib/actions/chat-gemini.action';
import { generateContentFromImageAction } from './lib/actions/generate-content-from-image.action';
import { generateContentAction } from './lib/actions/generate-content.action';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit the following website: https://makersuite.google.com/app/apikey
2. Once on the website, locate and click on the option to obtain your API Key.
Please note this piece uses a API in the beta phase that may change at any time.
`;

export const googleGeminiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url:
          'https://generativelanguage.googleapis.com/v1beta/models?key=' +
          auth.auth,
        method: HttpMethod.GET,
      });
      return {
        valid: true,
      };
    } catch (e: any) {
      const extraErrorInfo = e.response?.body?.error?.message
        ? `${e.response?.body?.error?.message} status:${e.response?.body?.error?.code}`
        : e;
      return {
        valid: false,
        error: `${extraErrorInfo}`,
      };
    }
  },
});

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
    generateContentFromImageAction,
    chatGemini,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://generativelanguage.googleapis.com/v1beta';
      },
      auth: googleGeminiAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});
