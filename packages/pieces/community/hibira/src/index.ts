import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { hibiraAuth } from './lib/auth';
import { deletePushUser } from './lib/actions/delete-push-user';
import { getChannel } from './lib/actions/get-channel';
import { getPresenceUsers } from './lib/actions/get-presence-users';
import { listChannels } from './lib/actions/list-channels';
import { publishToInterests } from './lib/actions/publish-to-interests';
import { publishToUsers } from './lib/actions/publish-to-users';
import { terminateUserConnections } from './lib/actions/terminate-user-connections';
import { triggerEvent } from './lib/actions/trigger-event';
import { newWebhookEvent } from './lib/triggers/new-webhook-event';

export { hibiraAuth };

export const hibira = createPiece({
  displayName: 'Hibira',
  description: 'Realtime WebSockets and push notifications, compatible with Pusher Channels and Beams',
  auth: hibiraAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/hibira.png',
  categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.COMMUNICATION],
  authors: ['deflinhec'],
  actions: [
    triggerEvent,
    listChannels,
    getChannel,
    getPresenceUsers,
    terminateUserConnections,
    publishToInterests,
    publishToUsers,
    deletePushUser,
  ],
  triggers: [newWebhookEvent],
});
