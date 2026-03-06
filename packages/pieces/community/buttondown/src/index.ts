import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { buttondownAuth } from './lib/auth';
import { createSubscriber } from './lib/actions/create-subscriber';
import { listSubscribers } from './lib/actions/list-subscribers';
import { sendEmail } from './lib/actions/send-email';
import { newSubscriber } from './lib/triggers/new-subscriber';

export const buttondown = createPiece({
  displayName: 'Buttondown',
  description: 'Minimalist email newsletter platform',
  auth: buttondownAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/buttondown.png',
  categories: [PieceCategory.MARKETING],
  authors: [],
  actions: [
    createSubscriber,
    listSubscribers,
    sendEmail,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.buttondown.email/v1',
      auth: buttondownAuth,
      authMapping: async (auth) => ({
        Authorization: `Token ${auth as string}`,
      }),
    }),
  ],
  triggers: [newSubscriber],
});
