import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { RetllAiAuth } from './lib/common/auth';
import { makeAPhoneCall } from './lib/actions/make-a-phone-call';
import { createAPhoneNumber } from './lib/actions/create-a-phone-number';
import { getACall } from './lib/actions/get-a-call';
import { getAPhoneNumber } from './lib/actions/get-a-phone-number';
import { getAVoice } from './lib/actions/get-a-voice';
import { getAnAgent } from './lib/actions/get-an-agent';
import { newcall } from './lib/triggers/newcall';

export const retellAi = createPiece({
  displayName: 'Retell-ai',
  auth: RetllAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/retell-ai.png',
  authors: ['Sanket6652'],
  actions: [
    makeAPhoneCall,
    createAPhoneNumber,
    getACall,
    getAPhoneNumber,
    getAVoice,
    getAnAgent,
  ],
  triggers: [newcall],
});
