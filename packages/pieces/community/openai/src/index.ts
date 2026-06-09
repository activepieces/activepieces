import {
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askAssistant } from './lib/actions/ask-assistant';
import { askOpenAI } from './lib/actions/send-prompt';
import { classifyText } from './lib/actions/classify-text';
import { createEmbedding } from './lib/actions/create-embedding';
import { deleteFile } from './lib/actions/delete-file';
import { editImage } from './lib/actions/edit-image';
import { extractStructuredDataAction } from './lib/actions/extract-structure-data.action';
import { generateImage } from './lib/actions/generate-image';
import { listFiles } from './lib/actions/list-files';
import { listModels } from './lib/actions/list-models';
import { textToSpeech } from './lib/actions/text-to-speech';
import { transcribeAction } from './lib/actions/transcriptions';
import { translateAction } from './lib/actions/translation';
import { uploadFile } from './lib/actions/upload-file';
import { visionPrompt } from './lib/actions/vision-prompt';
import { openaiAuth } from './lib/auth';
import { baseUrl } from './lib/common/common';

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
    visionPrompt,
    extractStructuredDataAction,
    classifyText,
    createEmbedding,
    generateImage,
    editImage,
    textToSpeech,
    transcribeAction,
    translateAction,
    uploadFile,
    listFiles,
    deleteFile,
    listModels,
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
    'onyedikachi-david'
  ],
  triggers: [],
});
