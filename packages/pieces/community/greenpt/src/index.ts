import { createPiece } from '@activepieces/pieces-framework';
import { greenptAuth } from './lib/common/auth';
import { chatCompletion } from './lib/actions/chat-completion';
import { createEmbeddings } from './lib/actions/create-embeddings';
import { transcribeAudio } from './lib/actions/transcribe-audio';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { BASE_URL } from './lib/common/client';

export const greenpt = createPiece({
  displayName: 'GreenPT',
  description:
    'GreenPT is a green AI and privacy friendly GPT-powered chat platform',
  auth: greenptAuth,
  minimumSupportedRelease: '0.88.2',
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
      props: {
        url: {
          description: `Full URL, or a path relative to ${BASE_URL}`,
          placeholder: '/models',
        },
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
