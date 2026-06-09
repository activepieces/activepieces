import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendEmail } from './lib/actions/send-email';
import { sendFromTemplate } from './lib/actions/send-from-template';
import { verifyEmail } from './lib/actions/verify-email';
import { mailerooAuth } from './lib/auth';

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
