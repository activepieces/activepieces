import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendSMSAction } from './lib/actions/send-sms.action';
import { PieceCategory } from '@activepieces/shared';
import { listMessages } from './lib/actions/list-messages';
import { birdAuth, BirdAuthValue } from './lib/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const messagebird = createPiece({
  displayName: 'Bird',
  description: 'Unified CRM for Marketing, Service & Payments',
  auth: birdAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/messagebird.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  authors: ['kishanprmr', 'geekyme','prasanna2000-max'],
  actions: [
    sendSMSAction,
    listMessages,
    createCustomApiCallAction({
      baseUrl: (auth)=> {
        return 'https://api.bird.com/workspaces/' + (auth as BirdAuthValue).workspaceId;
      },
      auth: birdAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as BirdAuthValue).apiKey}`,
        };
      }
    }),
  ],
  triggers: [],
});
