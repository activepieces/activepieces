import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendEmail } from './lib/actions/send-email';
import { mailjetAuth } from './lib/auth';

export const mailjet = createPiece({
  displayName: 'Mailjet',
  description: 'Email delivery service for sending transactional and marketing emails',
  auth: mailjetAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailjet.svg',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['christian-schab'],
  actions: [sendEmail],
  triggers: []
});
