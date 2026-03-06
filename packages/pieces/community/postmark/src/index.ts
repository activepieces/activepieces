import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { postmarkAuth } from './lib/auth';
import { sendEmail } from './lib/actions/send-email';
import { sendEmailWithTemplate } from './lib/actions/send-email-with-template';
import { listTemplates } from './lib/actions/list-templates';
import { getDeliveryStats } from './lib/actions/get-delivery-stats';
import { listBounces } from './lib/actions/list-bounces';
import { getOutboundOverview } from './lib/actions/get-outbound-overview';
import { newBounce } from './lib/triggers/new-bounce';

export const postmark = createPiece({
  displayName: 'Postmark',
  description:
    'Reliable transactional email delivery service for developers',
  auth: postmarkAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/postmark.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: [],
  actions: [
    sendEmail,
    sendEmailWithTemplate,
    listTemplates,
    getDeliveryStats,
    listBounces,
    getOutboundOverview,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.postmarkapp.com',
      auth: postmarkAuth,
      authMapping: async (auth) => ({
        'X-Postmark-Server-Token': auth as string,
      }),
    }),
  ],
  triggers: [newBounce],
});
