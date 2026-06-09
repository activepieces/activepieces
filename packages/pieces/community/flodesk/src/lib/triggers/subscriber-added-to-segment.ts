import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall, flodeskCommon } from '../common';

export const subscriberAddedToSegmentTrigger = createTrigger({
  auth: flodeskAuth,
  name: 'subscriber_added_to_segment',
  displayName: 'Subscriber Added to Segment',
  description: 'Triggered when a subscriber is added to a segment.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    segment_id: flodeskCommon.segment_id(false),
  },
  sampleData: {
    event: 'subscriber.added_to_segment',
    timestamp: '2026-06-09T10:53:00.000Z',
    data: {
      subscriber: {
        id: 'sub_123456789',
        email: 'subscriber@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        status: 'active',
      },
      segment: {
        id: 'seg_abc987654',
        name: 'Newsletter Subscribers',
      },
    },
  },
  async onEnable(context) {
    const response = await flodeskApiCall<{ id: string }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/webhooks',
      body: {
        name: 'Activepieces - Subscriber Added to Segment',
        post_url: context.webhookUrl,
        events: ['subscriber.added_to_segment'],
      },
    });

    await context.store.put('subscriber_added_to_segment_webhook', response.id);
  },
  async onDisable(context) {
    const storedWebhookId = await context.store.get<string>('subscriber_added_to_segment_webhook');
    if (storedWebhookId) {
      await flodeskApiCall({
        apiKey: context.auth.secret_text,
        method: HttpMethod.DELETE,
        endpoint: `/webhooks/${storedWebhookId}`,
      });
      await context.store.delete('subscriber_added_to_segment_webhook');
    }
  },
  async run(context) {
    const payload = context.payload.body as {
      event: string;
      data?: {
        segment?: {
          id?: string;
        };
      };
    };
    const targetSegmentId = context.propsValue.segment_id;
    if (targetSegmentId && payload.data?.segment?.id !== targetSegmentId) {
      return [];
    }
    return [payload];
  },
});
