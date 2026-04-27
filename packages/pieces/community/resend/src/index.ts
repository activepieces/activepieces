import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendEmail } from './lib/actions/send-email.action';
import { createContact } from './lib/actions/create-contact.action';
import { getEmailStatus } from './lib/actions/get-email-status.action';
import { emailBounced } from './lib/triggers/email-bounced.trigger';

export const resendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Resend API key from resend.com/api-keys',
  required: true,
});

export const resend = createPiece({
  displayName: 'Resend',
  description: 'The email API for developers',
  auth: resendAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/resend.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Tosh94'],
  actions: [sendEmail, createContact, getEmailStatus],
  triggers: [emailBounced],
});
