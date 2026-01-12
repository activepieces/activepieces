import { createPiece } from '@activepieces/pieces-framework';
import { openmicAiAuth } from './lib/common/auth';
import { createPhoneCall } from './lib/actions/create-phone-call';
import { findBot } from './lib/actions/find-bot';
import { findCall } from './lib/actions/find-call';
import { getBots } from './lib/actions/get-bots';
import { getCalls } from './lib/actions/get-calls';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { newPostCallSummary } from './lib/triggers/new-post-call-summary';
import { PieceCategory } from '@activepieces/shared';
import { BASE_URL } from './lib/common/client';

export const openmicAi = createPiece({
  displayName: 'OpenMic AI',
  auth: openmicAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/openmic-ai.png',
  authors: ['sanket-a11y'],
  description:
    'An AI-powered platform that automates phone calls using advanced language models.',
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    createPhoneCall,
    findBot,
    findCall,
    getBots,
    getCalls,
    createCustomApiCallAction({
      auth: openmicAiAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [newPostCallSummary],
});
