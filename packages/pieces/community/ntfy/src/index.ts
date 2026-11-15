import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { ntfyAuth } from './lib/auth';
import { ntfyClient } from './lib/common/client';
import { sendNotification } from './lib/actions/send-notification';
import { publishMessage } from './lib/actions/publish-message';
import { updateNotification } from './lib/actions/update-notification';
import { clearNotification } from './lib/actions/clear-notification';
import { deleteNotification } from './lib/actions/delete-notification';
import { sendFile } from './lib/actions/send-file';
import { fetchMessages } from './lib/actions/fetch-messages';
import { listScheduledMessages } from './lib/actions/list-scheduled-messages';
import { getAccount } from './lib/actions/get-account';
import { getServerStats } from './lib/actions/get-server-stats';
import { checkServerHealth } from './lib/actions/check-server-health';
import { getAttachmentInfo } from './lib/actions/get-attachment-info';
import { newMessage } from './lib/triggers/new-message';

export { ntfyAuth };

export const ntfy = createPiece({
  displayName: 'ntfy',
  description: 'Notification management made easy',

  logoUrl: 'https://cdn.activepieces.com/pieces/ntfy.png',
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.COMMUNICATION],
  auth: ntfyAuth,
  authors: ["MyWay","facferreira","la3rence","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  actions: [
    sendNotification,
    sendFile,
    updateNotification,
    clearNotification,
    deleteNotification,
    fetchMessages,
    listScheduledMessages,
    publishMessage,
    getAccount,
    getServerStats,
    checkServerHealth,
    getAttachmentInfo,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? ntfyClient.baseUrl(auth) : ''),
      auth: ntfyAuth,
      authMapping: async (auth) => ntfyClient.authHeaders(auth),
    }),
  ],
  triggers: [newMessage],
});
