import { createPiece } from '@activepieces/pieces-framework';
import { whatsscaleAuth } from './lib/auth';

// Sprint 2: Text actions
import { sendTextManualAction } from './lib/actions/messaging/send-text-manual';
import { sendTextToContactAction } from './lib/actions/messaging/send-text-to-contact';
import { sendTextToGroupAction } from './lib/actions/messaging/send-text-to-group';
import { sendTextToChannelAction } from './lib/actions/messaging/send-text-to-channel';
import { sendTextToCrmContactAction } from './lib/actions/messaging/send-text-to-crm-contact';

// Sprint 3: Image actions
import { sendImageToContactAction } from './lib/actions/messaging/send-image-to-contact';
import { sendImageToGroupAction } from './lib/actions/messaging/send-image-to-group';
import { sendImageToChannelAction } from './lib/actions/messaging/send-image-to-channel';
import { sendImageToCrmContactAction } from './lib/actions/messaging/send-image-to-crm-contact';
import { sendImageManualAction } from './lib/actions/messaging/send-image-manual';

export const whatsscale = createPiece({
  displayName: 'WhatsScale',
  auth: whatsscaleAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://whatsscale.com/logo.png',
  authors: ['mahidhark'],
  actions: [
    // Text actions
    sendTextManualAction,
    sendTextToContactAction,
    sendTextToGroupAction,
    sendTextToChannelAction,
    sendTextToCrmContactAction,
    // Image actions
    sendImageToContactAction,
    sendImageToGroupAction,
    sendImageToChannelAction,
    sendImageToCrmContactAction,
    sendImageManualAction,
  ],
  triggers: [],
});
