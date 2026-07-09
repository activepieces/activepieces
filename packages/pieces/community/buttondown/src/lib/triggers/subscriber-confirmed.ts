import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownRequest } from '../common/client';
import { createButtondownWebhookTrigger } from '../common/webhook';
import { ButtondownSubscriber } from '../common/types';

export const buttondownSubscriberConfirmed = createButtondownWebhookTrigger({
  name: 'buttondown_subscriber_confirmed',
  displayName: 'Subscriber Confirmed',
  description: 'Triggers when a subscriber confirms their email.',
  aiMetadata: {
    description:
      'Fires when a subscriber completes double opt-in and confirms their email address in Buttondown. Represents a subscriber transitioning to confirmed status; the payload is enriched with the full subscriber details.',
  },
  eventType: 'subscriber.confirmed',
  sampleData: {
    event_type: 'subscriber.confirmed',
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
