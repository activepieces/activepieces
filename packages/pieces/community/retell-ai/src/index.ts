import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { createPhoneNumber } from './lib/actions/create-phone-number';
import { getAgent } from './lib/actions/get-agent';
import { getCall } from './lib/actions/get-call';
import { getPhoneNumber } from './lib/actions/get-phone-number';
import { getVoice } from './lib/actions/get-voice';
import { makePhoneCall } from './lib/actions/make-phone-call';
import { retellAiAuth, retellCommon } from './lib/common';
import { newCall } from './lib/triggers/new-call';

export const retellAi = createPiece({
  displayName: 'Retell-ai',
  auth: retellAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/retell-ai.png',
  authors: ['LuizDMM'],
  actions: [
    makePhoneCall,
    createPhoneNumber,
    getCall,
    getPhoneNumber,
    getVoice,
    getAgent,
    createCustomApiCallAction({
      baseUrl: () => retellCommon.baseUrl,
      auth: retellAiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth as string}`,
      }),
    }),
  ],
  triggers: [newCall],
});
