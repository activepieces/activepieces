import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { amazonSESAuth } from './lib/common/auth';
import { sendEmail } from './lib/actions/send-email';
import { createEmailTemplate } from './lib/actions/create-email-template';
import { sendTemplatedEmail } from './lib/actions/send-templated-email';
import { updateEmailTemplate } from './lib/actions/update-email-template';
import { createACustomVerificationEmailTemplate } from './lib/actions/create-a-custom-verification-email-template';
import { sendACustomVerificationEmail } from './lib/actions/send-a-custom-verification-email';
import { updateACustomVerificationEmail } from './lib/actions/update-a-custom-verification-email';

export { amazonSESAuth };

export const amazonSes = createPiece({
  displayName: 'Amazon SES',
  description: 'Send emails using Amazon Simple Email Service (SES) v2',
  auth: amazonSESAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-ses.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Sanket6652'],
  actions: [
    sendEmail,
    createEmailTemplate,
    sendTemplatedEmail,
    updateEmailTemplate,
    createACustomVerificationEmailTemplate,
    sendACustomVerificationEmail,
    updateACustomVerificationEmail,
  ],
  triggers: [],
});
