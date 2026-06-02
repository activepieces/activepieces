```ts
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { openaiAuth } from './lib/auth';
import { baseUrl } from './lib/common/common';

// ==============================
// Actions
// ==============================

import { askAssistant } from './lib/actions/ask-assistant';
import { askOpenAI } from './lib/actions/send-prompt';

import { generateImage } from './lib/actions/generate-image';
import { editImage } from './lib/actions/edit-image';
import { visionPrompt } from './lib/actions/vision-prompt';

import { textToSpeech } from './lib/actions/text-to-speech';
import { transcribeAction } from './lib/actions/transcriptions';
import { translateAction } from './lib/actions/translation';

import { extractStructuredDataAction } from './lib/actions/extract-structure-data.action';

// ==============================
// Grouped Actions
// ==============================

const aiChatActions = [
  askOpenAI,
  askAssistant,
];

const imageActions = [
  generateImage,
  editImage,
  visionPrompt,
];

const audioActions = [
  textToSpeech,
  transcribeAction,
  translateAction,
];

const utilityActions = [
  extractStructuredDataAction,
];

// ==============================
// Custom API Action
// ==============================

const customApiCall = createCustomApiCallAction({
  auth: openaiAuth,

  baseUrl: () => baseUrl,

  authMapping: async (auth) => ({
    Authorization: `Bearer ${auth.secret_text}`,
  }),
});

// ==============================
// Piece Definition
// ==============================

export const openai = createPiece({
  displayName: 'OpenAI',

  description:
    'Integrate OpenAI models into Activepieces workflows for chat, vision, audio, image generation, and structured AI automation.',

  minimumSupportedRelease: '0.63.0',

  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',

  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
  ],

  auth: openaiAuth,

  actions: [
    ...aiChatActions,
    ...imageActions,
    ...audioActions,
    ...utilityActions,
    customApiCall,
  ],

  triggers: [],

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
    'onyedikachi-david',
  ],
});
```
