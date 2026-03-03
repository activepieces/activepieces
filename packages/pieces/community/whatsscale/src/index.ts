import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { whatsscaleAuth } from './lib/auth';
import { sendTextManualAction } from './lib/actions/messaging/send-text-manual';

export const whatsscale = createPiece({
  displayName: 'WhatsScale',
  description:
    'WhatsApp automation — send messages, manage contacts, and automate workflows through WhatsApp',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/whatsscale.png',
  authors: ['mahidhark'],
  categories: [PieceCategory.COMMUNICATION],
  auth: whatsscaleAuth,
  actions: [sendTextManualAction],
  triggers: [],
});
