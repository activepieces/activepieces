import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { grokAuth } from './lib/common/auth';
import { askGrokAction } from './lib/actions/ask-grok';
import { categorizeTextAction } from './lib/actions/categorize-text';
import { extractDataFromTextAction } from './lib/actions/extract-data-from-text';
import { generateImageAction } from './lib/actions/generate-image';

export const grok = createPiece({
  displayName: 'Grok xAI',
  auth: grokAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/gork.png',
  authors: ['aryel780'],
  actions: [
    askGrokAction,
    categorizeTextAction,
    extractDataFromTextAction,
    generateImageAction,
    createCustomApiCallAction({
      auth: grokAuth,
      baseUrl: () => 'https://openrouter.ai/api/v1',
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          Authorization: `Bearer ${apiKey}`,
        };
      },
    }),
  ],
  triggers: [],
});
