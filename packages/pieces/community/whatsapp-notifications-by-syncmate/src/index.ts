import { createPiece } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';
import { groupSend } from './lib/actions/group-send';
import { channelSend } from './lib/actions/channel-send';
import { whatsappOrderNotificationAuth } from './lib/common/auth';

export const whatsappOrderNotification = createPiece({
    displayName: 'WhatsApp Notifications By SyncMate',
    description: 'Send WhatsApp order notifications',
    auth: whatsappOrderNotificationAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/whatsapp.png',
    authors: [],
    actions: [sendMessage, groupSend, channelSend],
    triggers: [],
});
