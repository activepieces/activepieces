import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { askLocalAI } from './lib/actions/send-prompt';
import { listModels } from './lib/actions/list-models';
import { createEmbedding } from './lib/actions/create-embedding';
import { textToSpeech } from './lib/actions/text-to-speech';
import { transcribeAudio } from './lib/actions/transcribe-audio';
import { localaiAuth } from './lib/auth';
import { localaiCommon } from './lib/common';

export const openai = createPiece({
  displayName: 'LocalAI',
  description:
    'The free, Self-hosted, community-driven and local-first. Drop-in replacement for OpenAI running on consumer-grade hardware. No GPU required.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/localai.jpeg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: localaiAuth,
  actions: [
    askLocalAI,
    listModels,
    createEmbedding,
    textToSpeech,
    transcribeAudio,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? localaiCommon.baseUrl(auth) : ''),
      auth: localaiAuth,
      authMapping: async (auth) => localaiCommon.authHeaders(auth),
      props: {
        url: {
          description: 'Full URL, or a path relative to your LocalAI Server URL.',
          placeholder: '/models',
        },
      },
    }),
  ],
  authors: ["hkboujrida","kishanprmr","MoShizzle","abuaboud"],
  triggers: [],
});

export { localaiAuth };
