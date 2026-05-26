import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  createCustomApiCallAction,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { sendEmail } from './lib/actions/send-email';
import { sendBatchEmails } from './lib/actions/send-batch-emails.action';
import { createContact } from './lib/actions/create-contact.action';
import { getEmailStatus } from './lib/actions/get-email-status.action';
import { emailBounced } from './lib/triggers/email-bounced.trigger';

const BASE_URL = 'https://api.resend.com';

export const resendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your [Resend dashboard](https://resend.com/overview)
2. Go to **API Keys** in the left sidebar
3. Click **Create API Key**, give it a name, and copy the key`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/api-keys`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch (error) {
      // A restricted (send-only) key returns 401 with name 'restricted_api_key' — it is valid
      if (error instanceof HttpError) {
        const body = error.response.body;
        if (typeof body === 'object' && body !== null && 'name' in body && body.name === 'restricted_api_key') {
          return { valid: true };
        }
      }
      return { valid: false, error: 'Invalid API key. Please check your Resend API key.' };
    }
  },
});

export const resend = createPiece({
  displayName: 'Resend',
  description: 'The email API for developers',
  auth: resendAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/resend.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Tosh94'],
  actions: [
    sendEmail,
    sendBatchEmails,
    createContact,
    getEmailStatus,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: resendAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [emailBounced],
});
