import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendDynamicTemplate } from './lib/actions/send-dynamic-template';
import { sendEmail } from './lib/actions/send-email';
import { getApiKey, getBaseUrl, sendgridAuth, SendgridAuthValue } from './lib/common';

export { sendgridAuth, SendgridAuthValue } from './lib/common';

export const sendgrid = createPiece({
  displayName: 'SendGrid',
  description:
    'Email delivery service for sending transactional and marketing emails',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendgrid.png',
  authors: ['ashrafsamhouri', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'Thijs-Attenza'],
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  auth: sendgridAuth,
  actions: [
    sendEmail,
    sendDynamicTemplate,
    createCustomApiCallAction({
      baseUrl: (auth) => getBaseUrl(auth as SendgridAuthValue),
      auth: sendgridAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${getApiKey(auth as SendgridAuthValue)}`,
      }),
    }),
  ],
  triggers: [],
});
