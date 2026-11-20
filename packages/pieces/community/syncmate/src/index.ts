import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { syncmateAuth } from './lib/auth';
import { credentials, headersFor, normalizeBaseUrl } from './lib/common/client';
import { sendMessageAction } from './lib/actions/send-message';
import { sendGroupMessageAction } from './lib/actions/send-group-message';
import { sendChannelMessageAction } from './lib/actions/send-channel-message';
import { sendBulkMessageAction } from './lib/actions/send-bulk-message';
import {
  metaListTemplatesAction,
  metaSendMediaAction,
  metaSendTemplateAction,
  metaSendTextAction,
} from './lib/actions/meta-actions';
import {
  checkConnectionAction,
  getSendStatusAction,
  listChannelsAction,
  listGroupsAction,
} from './lib/actions/utility-actions';
import {
  messageStatusUpdatedTrigger,
  newMessageReceivedTrigger,
  newOutgoingMessageTrigger,
} from './lib/triggers/message-triggers';

export const syncmate = createPiece({
  displayName: 'WhatsApp by SyncMate',
  description:
    'WhatsApp automation by Assistro: send messages, files, bulk campaigns and Meta templates from a QR-connected number or the Meta Cloud API, and start flows on incoming messages, outgoing messages and delivery updates.',
  auth: syncmateAuth,
  minimumSupportedRelease: '0.36.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/syncmate.png',
  authors: ['assistro'],
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  actions: [
    sendMessageAction,
    sendGroupMessageAction,
    sendChannelMessageAction,
    sendBulkMessageAction,
    metaSendTextAction,
    metaSendTemplateAction,
    metaSendMediaAction,
    metaListTemplatesAction,
    listGroupsAction,
    listChannelsAction,
    checkConnectionAction,
    getSendStatusAction,
    createCustomApiCallAction({
      auth: syncmateAuth,
      baseUrl: (auth) => normalizeBaseUrl((auth as { props?: { baseUrl?: string } } | undefined)?.props?.baseUrl),
      authMapping: async (auth) => headersFor(credentials(auth).apiKey),
    }),
  ],
  triggers: [
    newMessageReceivedTrigger,
    newOutgoingMessageTrigger,
    messageStatusUpdatedTrigger,
  ],
});
