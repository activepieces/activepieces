import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { whatsscaleAuth } from './lib/auth';
import { sendTextManualAction } from './lib/actions/messaging/send-text-manual';
import { sendTextToContactAction } from './lib/actions/messaging/send-text-to-contact';
import { sendTextToGroupAction } from './lib/actions/messaging/send-text-to-group';
import { sendTextToChannelAction } from './lib/actions/messaging/send-text-to-channel';
import { sendTextToCrmContactAction } from './lib/actions/messaging/send-text-to-crm-contact';

export const whatsscale = createPiece({
  displayName: 'WhatsScale',
  description:
    'WhatsApp automation — send messages, manage contacts, and automate workflows through WhatsApp',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/whatsscale.png',
  authors: ['mahidhark'],
  categories: [PieceCategory.COMMUNICATION],
  auth: whatsscaleAuth,
  actions: [
    sendTextManualAction,
    sendTextToContactAction,
    sendTextToGroupAction,
    sendTextToChannelAction,
    sendTextToCrmContactAction,
  ],
  triggers: [],
});
