import {
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { edenAuth } from './lib/common/auth';
import { generateAction } from './lib/actions/generate-text';
import { extractKeywordsAction } from './lib/actions/extract-keywords';
import { summarizeTextAction } from './lib/actions/summarize-text';
import { extractNamedEntitiesAction } from './lib/actions/extract-named-entities';
import { moderateTextAction } from './lib/actions/moderate-text';
import { spellCheckAction } from './lib/actions/spell-check';
import { translateTextAction } from './lib/actions/translate-text';
import { detectLanguageAction } from './lib/actions/detect-language';
import { invoiceParserAction } from './lib/actions/invoice-parser';
import { receiptParserAction } from './lib/actions/receipt-parser';
import { extractTextOcrAction } from './lib/actions/extract-text-ocr';
import { imageGenerationAction } from './lib/actions/image-generation';
import { generateAudioAction } from './lib/actions/generate-audio';

export const edenai = createPiece({
  displayName: 'Eden AI',
  auth: edenAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/eden-ai.png',
  authors: ['krushnarout'],
  actions: [
    generateAction,
    extractKeywordsAction,
    summarizeTextAction,
    extractNamedEntitiesAction,
    moderateTextAction,
    spellCheckAction,
    translateTextAction,
    detectLanguageAction,
    invoiceParserAction,
    receiptParserAction,
    extractTextOcrAction,
    imageGenerationAction,
    generateAudioAction,
    createCustomApiCallAction({
      auth: edenAuth,
      baseUrl: () => `https://api.edenai.run/v2`,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
