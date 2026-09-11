import {
  createPiece,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { smtpAuth } from './lib/auth';

export { smtpAuth } from './lib/auth';

export const smtp = createPiece({
  displayName: 'SMTP',
  description: 'Send emails using Simple Mail Transfer Protocol',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/smtp.svg',
  categories: [PieceCategory.CORE],
  authors: [
    'tahboubali',
    'abaza738',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'pfernandez98'
  ],
  auth: smtpAuth,
  actions: [sendEmail],
  triggers: [],
});
