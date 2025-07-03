import { HttpError } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import FormData from 'form-data';
import { sendEmail } from './lib/actions/send-email';
import { sendFromTemplate } from './lib/actions/send-from-template';
import { checkEmail, sendFormData } from './lib/common/send-utils';
import { verifyEmail } from './lib/actions/verify-email';

const markdown = `
For Sending API key, follow these steps:
1. Navigate to [Domains](https://app.maileroo.com/domains).
2. Click on the domain you want to use.
3. Click on the **Create sending key** under the API section.
4. Click **New Sending Key**.
5. Copy the key under the **Sending Key** column.

For Verification API key, follow these steps:
1. Navigate to [Verification API](https://app.maileroo.com/verifications).
2. Copy the key under the **Verification API** section.
`;

export const mailerooAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    keyType: Property.StaticDropdown({
      displayName: 'Type',
      defaultValue: 'sending',
      options: {
        options: [
          {
            label: 'Sending Key',
            value: 'sending',
          },
          {
            label: 'Verification Key',
            value: 'verification',
          },
        ],
      },
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    // This wont' matter as we are just testing the API key validity
    const PLACEHOLDER_STRING = 'placeholder';

    if (auth.keyType === 'sending') {
      try {
        const formData = new FormData();
        formData.append('from', PLACEHOLDER_STRING);
        formData.append('to', PLACEHOLDER_STRING);
        formData.append('subject', PLACEHOLDER_STRING);
        formData.append('plain', PLACEHOLDER_STRING);

        await sendFormData('send', formData, auth.apiKey);
      } catch (e) {
        const status = (e as HttpError).response.status;

        // It is safe to assume that that other 4xx status codes means the API key is valid
        if (status === 401) {
          return {
            valid: false,
            error: 'Invalid API Sending key',
          };
        } else if (status >= 500) {
          return {
            valid: false,
            error: 'An error occurred while validating the API key',
          };
        }
      }

      return {
        valid: true,
      };
    } else {
      // Need a different implementation because the response for verification key is different
      const result = await checkEmail(PLACEHOLDER_STRING, auth.apiKey);

      if (result.status === 200 && result.body.error_code !== '0401') {
        return {
          valid: true,
        };
      } else {
        return {
          error: 'Invalid Verification API key',
          valid: false,
        };
      }
    }
  },
});

export const maileroo = createPiece({
  displayName: 'Maileroo',
  auth: mailerooAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/maileroo.png',
  categories: [
    PieceCategory.MARKETING,
    PieceCategory.BUSINESS_INTELLIGENCE,
    PieceCategory.COMMUNICATION,
  ],
  description: 'Email Delivery Service with Real-Time Analytics and Reporting',
  authors: ['codegino'],
  actions: [sendEmail, sendFromTemplate, verifyEmail],
  triggers: [],
});
