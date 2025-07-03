import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendSMSAction } from './lib/actions/send-sms.action';
import { PieceCategory } from '@activepieces/shared';
import { birdAuth } from './lib/auth';

export const messagebird = createPiece({
  displayName: 'Bird',
  description: 'Unified CRM for Marketing, Service & Payments',
  auth: birdAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/messagebird.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  authors: ['kishanprmr', 'geekyme'],
  actions: [sendSMSAction],
  triggers: [],
});
