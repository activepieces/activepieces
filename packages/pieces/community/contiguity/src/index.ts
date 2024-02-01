import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendSMS } from './lib/actions/send-sms';

export const contigAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Contiguity settings',
});

export const contiguity = createPiece({
  displayName: 'Contiguity',
  description: 'An SMS service for your needs - quick and simple',
  auth: contigAuth,
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/contiguity.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Owlcept'],
  actions: [sendSMS],
  triggers: [],
});
