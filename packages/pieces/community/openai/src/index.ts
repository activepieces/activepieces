import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory,  } from '@activepieces/shared';
import { askAssistant } from './lib/actions/ask-assistant';
import { generateImage } from './lib/actions/generate-image';
import { askOpenAI } from './lib/actions/send-prompt';
import { textToSpeech } from './lib/actions/text-to-speech';
import { transcribeAction } from './lib/actions/transcriptions';
import { translateAction } from './lib/actions/translation';
import { visionPrompt } from './lib/actions/vision-prompt';
import { baseUrl } from './lib/common/common';
import { extractStructuredDataAction } from './lib/actions/extract-structure-data.action';
import { openaiAuth } from './lib/auth';

export const openai = createPiece({
  displayName: 'OpenAI',
  description: 'Use the many tools ChatGPT has to offer.',
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: openaiAuth,
  actions: [
    askOpenAI,
    askAssistant,
    generateImage,
    visionPrompt,
    textToSpeech,
    transcribeAction,
    translateAction,
    extractStructuredDataAction,
    createCustomApiCallAction({
      auth: openaiAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  authors: [
    'aboudzein',
    'astorozhevsky',
    'Willianwg',
    'Nilesh',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'amrdb',
  ],
  triggers: [],
});
