import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';

export const postmark = createPiece({
  displayName: 'Postmark',
  auth: PieceAuth.SecretText({
    displayName: 'Server Token',
    description: 'Enter your Postmark Server Token',
    required: true,
  }),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/postmark.png',
  authors: ['Angelebeats'],
  actions: [sendEmail],
  triggers: [],
});
