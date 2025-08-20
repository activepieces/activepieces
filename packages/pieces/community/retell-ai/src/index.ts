import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { RetllAiAuth } from './lib/common/auth';
import { makeAPhoneCall } from './lib/actions/make-a-phone-call';

export const retellAi = createPiece({
  displayName: 'Retell-ai',
  auth: RetllAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/retell-ai.png',
  authors: ['Sanket6652'],
  actions: [makeAPhoneCall],
  triggers: [],
});
