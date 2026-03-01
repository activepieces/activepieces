import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { SES, GetSendQuotaCommand } from '@aws-sdk/client-ses';
import { sendEmail } from './lib/actions/send-email';
import { createEmailTemplate } from './lib/actions/create-email-template';
import { sendTemplatedEmail } from './lib/actions/send-templated-email';
import { updateEmailTemplate } from './lib/actions/update-email-template';
import { createCustomVerificationEmailTemplate } from './lib/actions/create-custom-verification-email-template';
import { sendCustomVerificationEmail } from './lib/actions/send-custom-verification-email';
import { updateCustomVerificationEmailTemplate } from './lib/actions/update-custom-verification-email-template';
import { amazonSesAuth } from './lib/auth';

export const amazonSes = createPiece({
  displayName: 'Amazon SES',
  auth: amazonSesAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-ses.png',
  authors: ["fortunamide"],
  actions: [
    sendEmail,
    createEmailTemplate,
    sendTemplatedEmail,
    updateEmailTemplate,
    createCustomVerificationEmailTemplate,
    sendCustomVerificationEmail,
    updateCustomVerificationEmailTemplate,
  ],
  triggers: [],
});
