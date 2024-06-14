import { HttpError } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import FormData from 'form-data';
import { sendEmail } from './lib/actions/send-email';
import { sendFromTemplate } from './lib/actions/send-from-template';
import { sendFormData } from './lib/common/send-utils';

const markdown = `
To obtain a Maileroo API key, follow these steps:

1. https://app.maileroo.com/domains
2. Click on the domain you want to use
3. Click on the **Create sending key** under the API section
4. Click **New Sending Key**
4. Copy the key under the **Sending Key** column
`;

export const mailerooAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdown,
  validate: async (auth) => {
    // This wont' matter as we are just testing the API key validity
    const PLACEHOLDER_STRING = 'placeholder';

    try {
      const formData = new FormData();
      formData.append('from', PLACEHOLDER_STRING);
      formData.append('to', PLACEHOLDER_STRING);
      formData.append('subject', PLACEHOLDER_STRING);
      formData.append('plain', PLACEHOLDER_STRING);

      await sendFormData('send', formData, auth.auth);
    } catch (e) {
      const status = (e as HttpError).response.status;

      // It is safe to assume that that other 4xx status codes means the API key is valid
      if (status === 401) {
        return {
          valid: false,
          error: 'Invalid API key',
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
  },
});

export const maileroo = createPiece({
  displayName: 'Maileroo',
  auth: mailerooAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/maileroo.png',
  categories: [PieceCategory.MARKETING],
  authors: ['codegino'],
  actions: [sendEmail, sendFromTemplate],
  triggers: [],
});
