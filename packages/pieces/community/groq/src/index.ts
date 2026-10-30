import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { askAiAction } from './lib/actions/ask-ai';
import { transcribeAudioAction } from './lib/actions/transcribe-audio';
import { translateAudioAction } from './lib/actions/translate-audio';
import { groqAuth } from './lib/auth';
import { groqClient } from './lib/common/client';

export const groq = createPiece({
  displayName: 'Groq',
  description:
    "Use Groq's fast language models and audio processing capabilities.",
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/groq.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: groqAuth,
  actions: [
    askAiAction,
    transcribeAudioAction,
    translateAudioAction,
    createCustomApiCallAction({
      auth: groqAuth,
      baseUrl: () => groqClient.baseUrl(),
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
      props: {
        url: {
          description: `Full URL, or a path relative to ${groqClient.baseUrl()}`,
          placeholder: '/models',
        },
      },
    }),
  ],
  authors: ['abuaboud'],
  triggers: [],
});
