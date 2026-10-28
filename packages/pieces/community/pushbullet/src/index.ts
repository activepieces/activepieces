import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { bushbulletAuth } from './lib/common/auth';
import { pushbulletApi } from './lib/common/client';
import { sendALink } from './lib/actions/send-a-link';
import { sendANote } from './lib/actions/send-a-note';
import { aiSendNote } from './lib/actions/ai/send-note';
import { aiSendLink } from './lib/actions/ai/send-link';
import { aiListPushes } from './lib/actions/ai/list-pushes';
import { aiDismissPush } from './lib/actions/ai/dismiss-push';
import { aiDeletePush } from './lib/actions/ai/delete-push';
import { aiListDevices } from './lib/actions/ai/list-devices';
import { aiListChats } from './lib/actions/ai/list-chats';
import { aiGetCurrentUser } from './lib/actions/ai/get-current-user';
import { newPushTrigger } from './lib/triggers/new-push';

export const pushbullet = createPiece({
  displayName: 'Pushbullet',
  description: 'Cross-device notification service',
  categories: [PieceCategory.COMMUNICATION],
  auth: bushbulletAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/pushbullet.png',
  authors: ['sanket-a11y'],
  actions: [
    sendALink,
    sendANote,
    aiSendNote,
    aiSendLink,
    aiListPushes,
    aiDismissPush,
    aiDeletePush,
    aiListDevices,
    aiListChats,
    aiGetCurrentUser,
    createCustomApiCallAction({
      auth: bushbulletAuth,
      baseUrl: () => pushbulletApi.baseUrl,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text.trim()}`,
      }),
    }),
  ],
  triggers: [newPushTrigger],
});
