import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { getDeliveryStats } from './lib/actions/get-delivery-stats';
import { getEmailBounces } from './lib/actions/get-bounces';
import { sendEmail } from './lib/actions/send-email';
import { sendEmailWithTemplate } from './lib/actions/send-email-with-template';
import { postmarkAuth } from './lib/auth';

export const postmark = createPiece({
  displayName: 'Postmark',
  description:
    'Transactional email platform for sending email, templates, and retrieving delivery and bounce insights.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/postmark.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  auth: postmarkAuth,
  actions: [
    sendEmail,
    sendEmailWithTemplate,
    getEmailBounces,
    getDeliveryStats,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.postmarkapp.com',
      auth: postmarkAuth,
      authMapping: async (auth) => ({
        'X-Postmark-Server-Token': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
