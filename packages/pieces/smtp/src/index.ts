
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { sendEmail } from './lib/actions/send-email';

export const smtp = createPiece({
  name: 'smtp',
  displayName: 'SMTP',
  logoUrl: 'https://cdn.activepieces.com/pieces/smtp.png',
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: [
    'abaza738'
  ],
  actions: [
    sendEmail,
  ],
  triggers: [
  ],
});
