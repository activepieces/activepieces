import { createPiece } from '@activepieces/pieces-framework';
import { greenptAuth } from './lib/common/auth';
import { chatCompletion } from './lib/actions/chat-completion';
import { createEmbeddings } from './lib/actions/create-embeddings';
import { transcribeAudio } from './lib/actions/transcribe-audio';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

export const greenpt = createPiece({
  displayName: 'GreenPT',
  description:
    'GreenPT is a green AI and privacy friendly GPT-powered chat platform',
  auth: greenptAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/greenpt.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    chatCompletion,
    createEmbeddings,
    transcribeAudio,
    createCustomApiCallAction({
      auth: greenptAuth,
      baseUrl: () => `https://api.greenpt.ai/v1`,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
