import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createSubscriptionAction } from './lib/actions/create-subscription.action';
import { updateSubscriptionAction } from './lib/actions/update-subscription.action';
import { addSubscriptionToAutomationAction } from './lib/actions/add-subscription-to-automation.action';
import { listAutomationsAction } from './lib/actions/list-automations.action';
import { listPostsAction } from './lib/actions/list-posts.action';
import { newPostSent } from './lib/triggers/new-post-sent.trigger';
import { userUnsubscribes } from './lib/triggers/user-unsubscribes.trigger';
import { newSubscriptionConfirmed } from './lib/triggers/new-subscription-confirmed.trigger';

export const beehiivAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Beehiiv API Key. Found in your Beehiiv account under Settings > Integrations.',
  required: true,
});

export const beehiiv = createPiece({
  displayName: 'Beehiiv',
  auth: beehiivAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/beehiiv.png',
  authors: ['KCK-01'],
  actions: [
    createSubscriptionAction,
    updateSubscriptionAction,
    addSubscriptionToAutomationAction,
    listAutomationsAction,
    listPostsAction
  ],
  triggers: [newPostSent, userUnsubscribes, newSubscriptionConfirmed],
});
