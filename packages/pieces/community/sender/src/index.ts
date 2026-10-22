import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { senderAuth } from './lib/auth';
import { senderClient } from './lib/common/client';
import { senderAiActions } from './lib/actions/ai';
import { addUpdateSubscriberAction } from './lib/actions/add-subscriber';
import { createCampaignAction } from './lib/actions/create-campaign';
import { unsubscribeSubscriberAction } from './lib/actions/unsubscribe-subscriber';
import { addSubscriberToGroupAction } from './lib/actions/add-subscriber-to-group';
import { removeSubscriberFromGroupAction } from './lib/actions/remove-subscriber-from-group';
import { sendCampaignAction } from './lib/actions/send-campaign';
import { newCampaignTrigger } from './lib/triggers/new-campaign';
import { newGroupTrigger } from './lib/triggers/new-group';
import { newSubscriberTrigger } from './lib/triggers/new-subscriber';
import { newSubscriberInGroupTrigger } from './lib/triggers/new-subscriber-in-group';
import { updatedSubscriberTrigger } from './lib/triggers/updated-subscriber';
import { newUnsubscriberTrigger } from './lib/triggers/new-unsubscriber';
import { newUnsubscriberFromGroupTrigger } from './lib/triggers/new-unsubscriber-from-group';
import { updateSubscriberAction } from './lib/actions/update-subscriber';

export const sender = createPiece({
  displayName: 'Sender',
  auth: senderAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/sender.png',
  authors: ['Ani-4x','sanket-a11y'],
  categories: [PieceCategory.MARKETING],
  actions: [
    addUpdateSubscriberAction,
    createCampaignAction,
    unsubscribeSubscriberAction,
    addSubscriberToGroupAction,
    removeSubscriberFromGroupAction,
    sendCampaignAction,
    updateSubscriberAction,
    ...senderAiActions,
    createCustomApiCallAction({
      auth: senderAuth,
      baseUrl: () => senderClient.baseUrl(),
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    newCampaignTrigger,
    newGroupTrigger,
    newSubscriberTrigger,
    newSubscriberInGroupTrigger,
    updatedSubscriberTrigger,
    newUnsubscriberTrigger,
    newUnsubscriberFromGroupTrigger,
  ],
});