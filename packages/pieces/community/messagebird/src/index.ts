import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendSMSAction } from './lib/actions/send-sms.action';
import { PieceCategory } from '@activepieces/shared';

export const messageBirdAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: '',
  required: true,
});

export const messagebird = createPiece({
  displayName: 'MessageBird',
  description: 'Next generation CRM for Marketing, Services and Payments',
  auth: messageBirdAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/messagebird.png',
  categories: [PieceCategory.MARKETING],
  authors: ['kishanprmr'],
  actions: [sendSMSAction],
  triggers: [],
});
