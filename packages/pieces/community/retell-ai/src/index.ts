
    import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
    import { PieceCategory } from '@activepieces/shared';
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
    import { retellAiAuth } from './lib/common/auth';
    import { makePhoneCall } from './lib/actions/make-phone-call';
    import { createPhoneNumber } from './lib/actions/create-phone-number';
    import { getCall } from './lib/actions/get-call';
    import { getPhoneNumber } from './lib/actions/get-phone-number';
    import { getVoice } from './lib/actions/get-voice';
    import { getAgent } from './lib/actions/get-agent';
    import { newCall } from './lib/triggers/new-call';

    export const retellAi = createPiece({
      displayName: 'Retell AI',
      description: 'Voice AI platform that automates phone calling workflows with intelligent, customizable AI voice agents',
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/retell-ai.png',
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.COMMUNICATION],
      auth: retellAiAuth,
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
          authMapping: async (auth) => ({
            Authorization: `Bearer ${auth}`,
          }),
        }),
      ],
      triggers: [newCall],
      authors: ['activepieces'],
    });
    