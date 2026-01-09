import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendDynamicTemplate } from './lib/actions/send-dynamic-template';
import { sendEmail } from './lib/actions/send-email';
import { sendgridCommon } from './lib/common';

export const sendgridAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'API key acquired from your SendGrid settings',
      required: true
    }),
    dataResidency: Property.StaticDropdown({
      displayName: 'Data Residency',
      description: 'Select the Data Residency for this API key',
      required: true,
      defaultValue: 'US',
      options: {
        options: [
          {
            label: 'Global (US)',

            value: 'US',
          },
          {
            label: 'EU',
            value: 'EU',
          },
        ],
      },
    })
  },
});

export const sendgrid = createPiece({
  displayName: 'SendGrid',
  description:
    'Email delivery service for sending transactional and marketing emails',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendgrid.png',
  authors: ["ashrafsamhouri","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  auth: sendgridAuth,
  actions: [
    sendEmail,
    sendDynamicTemplate,
    createCustomApiCallAction({
      baseUrl: (auth) => sendgridCommon.baseUrl(auth?.props?.dataResidency),
      auth: sendgridAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth?.props?.apiKey}`,
      }),
    }),
  ],
  triggers: [],
});
