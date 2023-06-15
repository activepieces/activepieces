
import { createPiece } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';

export const smtp = createPiece({
  displayName: 'SMTP',
  logoUrl: 'https://cdn.activepieces.com/pieces/smtp.png',
  authors: [
    'abaza738'
  ],
  actions: [
    sendEmail,
  ],
  triggers: [
  ],
});
