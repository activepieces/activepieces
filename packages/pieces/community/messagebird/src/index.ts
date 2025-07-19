import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { sendSMSAction } from './lib/actions/send-sms.action';
import { PieceCategory } from '@ensemble/shared';
import { listMessages } from './lib/actions/list-messages';
import { birdAuth } from './lib/auth';

export const messagebird = createPiece({
  displayName: 'Bird',
  description: 'Unified CRM for Marketing, Service & Payments',
  auth: birdAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/messagebird.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  authors: ['kishanprmr', 'geekyme','prasanna2000-max'],
  actions: [sendSMSAction,listMessages],
  triggers: [],
});
