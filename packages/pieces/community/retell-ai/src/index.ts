
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from "@activepieces/pieces-framework";
import { retellAiAuth } from './lib/common/auth';
import { makePhoneCall } from './lib/actions/make-phone-call';
import { createPhoneNumber } from './lib/actions/create-phone-number';
import { getCall } from './lib/actions/get-call';
import { getPhoneNumber } from './lib/actions/get-phone-number';
import { getVoice } from './lib/actions/get-voice';
import { getAgent } from './lib/actions/get-agent';
import { newCallTrigger } from './lib/triggers/new-call';
import { PieceCategory } from '@activepieces/shared';

export const retellAi = createPiece({
  displayName: "Retell AI",
  auth: retellAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/retell-ai.png",
  authors: ['aryel780'],
  categories:[PieceCategory.BUSINESS_INTELLIGENCE,PieceCategory.PRODUCTIVITY,PieceCategory.COMMUNICATION],
  actions: [
    makePhoneCall, 
    createPhoneNumber, 
    getCall, 
    getPhoneNumber, 
    getVoice, 
    getAgent,
    createCustomApiCallAction({
      auth: retellAiAuth,
      baseUrl: () => 'https://api.retellai.com',
      authMapping: async (auth: unknown) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          Authorization: `Bearer ${apiKey}`,
        };
      },
    }),
  ],
  triggers: [newCallTrigger],
});
