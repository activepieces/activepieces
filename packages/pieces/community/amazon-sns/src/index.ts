import { createPiece } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from './lib/auth';
import { sendMessageAction } from './lib/actions/send-message';
import { sendSmsAction } from './lib/actions/send-sms';
import { listTopicsAction } from './lib/actions/list-topics';
import { getTopicAction } from './lib/actions/get-topic';
import { createTopicAction } from './lib/actions/create-topic';
import { deleteTopicAction } from './lib/actions/delete-topic';
import { listSubscriptionsAction } from './lib/actions/list-subscriptions';
import { subscribeAction } from './lib/actions/subscribe';
import { setSubscriptionAttributeAction } from './lib/actions/set-subscription-attribute';
import { unsubscribeAction } from './lib/actions/unsubscribe';

export const amazonSns = createPiece({
  displayName: 'Amazon SNS',
  description: 'Publish messages and SMS, and manage topics and subscriptions in Amazon Simple Notification Service.',
  auth: amazonSnsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/amazon-sns.png',
  authors: ['coat'],
  actions: [
    sendMessageAction,
    sendSmsAction,
    listTopicsAction,
    getTopicAction,
    createTopicAction,
    deleteTopicAction,
    listSubscriptionsAction,
    subscribeAction,
    setSubscriptionAttributeAction,
    unsubscribeAction,
  ],
  triggers: [],
});

export { amazonSnsAuth };
