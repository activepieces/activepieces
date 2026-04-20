import { createPiece } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';
import { groupSend } from './lib/actions/group-send';
import { channelSend } from './lib/actions/channel-send';
import { whatsappOrderNotificationAuth } from './lib/common/auth';

export const whatsappOrderNotification = createPiece({
    displayName: 'WhatsApp Notifications by Syncmate',
    description: 'Send WhatsApp order notifications using Syncmate',
    auth: whatsappOrderNotificationAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/assistro.png',
    authors: ['assistro-syncmate'],
    actions: [sendMessage, groupSend, channelSend],
    triggers: [],
});
