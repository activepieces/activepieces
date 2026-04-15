import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownRequest } from '../common/client';
import { createButtondownWebhookTrigger } from '../common/webhook';
import { ButtondownSubscriber } from '../common/types';

export const buttondownNewSubscriber = createButtondownWebhookTrigger({
  name: 'buttondown_new_subscriber',
  displayName: 'New Subscriber',
  description: 'Triggers when a new subscriber is created.',
  eventType: 'subscriber.created',
  sampleData: {
    event_type: 'subscriber.created',
    data: {
      subscriber: 'sub_123456789',
    },
  },
  enrich: async ({ apiKey, payload }) => {
    const subscriberData = payload.data?.['subscriber'];
    let subscriber: ButtondownSubscriber | undefined;

    if (typeof subscriberData === 'string') {
      subscriber = await buttondownRequest<ButtondownSubscriber>({
        auth: apiKey,
        method: HttpMethod.GET,
        path: `/subscribers/${encodeURIComponent(subscriberData)}`,
      });
    } else if (subscriberData && typeof subscriberData === 'object') {
      subscriber = subscriberData as ButtondownSubscriber;
    }

    return {
      subscriber,
    };
  },
});
