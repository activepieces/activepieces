import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { blandAiAuth, BLAND_AI_BASE_URL } from './lib/auth';
import { sendCall } from './lib/actions/send-call';
import { getCallDetails } from './lib/actions/get-call-details';
import { listCalls } from './lib/actions/list-calls';
import { stopCall } from './lib/actions/stop-call';
import { analyzeCall } from './lib/actions/analyze-call';

export const blandAi = createPiece({
  displayName: 'Bland AI',
  description:
    'AI phone calling platform. Send and manage AI-powered voice calls at scale.',
  auth: blandAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bland-ai.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Harmatta'],
  actions: [
    sendCall,
    getCallDetails,
    listCalls,
    stopCall,
    analyzeCall,
    createCustomApiCallAction({
      baseUrl: () => BLAND_AI_BASE_URL,
      auth: blandAiAuth,
      authMapping: async (auth) => ({ authorization: auth.secret_text }),
    }),
  ],
  triggers: [],
});
