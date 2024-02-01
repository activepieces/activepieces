import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { sendDynamicTemplate } from './lib/actions/send-dynamic-template';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { sendgridCommon } from './lib/common';

export const sendgridAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your SendGrid settings',
});

export const sendgrid = createPiece({
  displayName: 'SendGrid',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendgrid.png',
  authors: ['ashrafsamhouri', 'abuaboud'],
  auth: sendgridAuth,
  actions: [
    sendEmail,
    sendDynamicTemplate,
    createCustomApiCallAction({
      baseUrl: () => sendgridCommon.baseUrl,
      auth: sendgridAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
