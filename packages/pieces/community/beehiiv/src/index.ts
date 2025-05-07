import { createPiece } from '@activepieces/pieces-framework';
import { BEEHIIV_API_URL, beehiivAuth } from './lib/common';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { createSubscription } from './lib/actions/create-subscription';
import { updateSubscriber } from './lib/actions/update-subscriber';
import { addSubscriberToAutomation } from './lib/actions/add-subscriber-to-automation';
import { listAllAutomations } from './lib/actions/list-all-automations';
import { listAllPosts } from './lib/actions/list-all-posts';

// Import triggers
import { newPostSent } from './lib/triggers/new-post-sent';
import { userUnsubscribes } from './lib/triggers/user-unsubscribes';
import { newSubscriptionConfirmation } from './lib/triggers/new-subscription-confirmation';

export const beehiiv = createPiece({
  displayName: 'beehiiv',
  description: 'Powerful newsletter platform for creators and publishers',
  logoUrl: 'https://cdn.activepieces.com/pieces/beehiiv.png',
  categories: [PieceCategory.MARKETING, PieceCategory.CONTENT_AND_FILES],
  auth: beehiivAuth,
  minimumSupportedRelease: '0.36.1',
  authors: ['activepieces-community'],
  actions: [
    createSubscription,
    updateSubscriber,
    addSubscriberToAutomation,
    listAllAutomations,
    listAllPosts,
    createCustomApiCallAction({
      baseUrl: () => BEEHIIV_API_URL,
      auth: beehiivAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    newPostSent,
    userUnsubscribes,
    newSubscriptionConfirmation,
  ],
});
