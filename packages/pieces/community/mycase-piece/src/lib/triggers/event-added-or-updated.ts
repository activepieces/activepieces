import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

interface WebhookSubscription {
  id: string;
  hmac_key: string;
}

export const eventAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'event_added_or_updated',
  displayName: 'Event Added or Updated',
  description: 'Triggers when an event has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    name: 'Client Meeting',
    description: 'Initial consultation with client',
    start: '2024-01-15T10:00:00Z',
    end: '2024-01-15T11:00:00Z',
    all_day: false,
    private: false,
    event_type: 'Meeting',
    location: {
      id: 1,
    },
    case: {
      id: 100,
    },
    staff: [
      {
        id: 5,
      },
    ],
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T09:30:00Z',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(ctx) {
    const api = createMyCaseApi(ctx.auth);

    const requestBody = {
      model: 'event',
      url: ctx.webhookUrl,
      actions: ['created', 'updated'],
    };

    const response = await api.post('/webhooks/subscriptions', requestBody);

    if (response.success && response.data) {
      await ctx.store.put<WebhookSubscription>('_webhook_subscription', {
        id: response.data.id,
        hmac_key: response.data.hmac_key,
      });
    } else {
      throw new Error(
        `Failed to create webhook subscription: ${response.error}`
      );
    }
  },
  async onDisable(ctx) {
    const subscription =
      await ctx.store.get<WebhookSubscription>('_webhook_subscription');

    if (subscription) {
      const api = createMyCaseApi(ctx.auth);
      await api.delete(`/webhooks/subscriptions/${subscription.id}`);
      await ctx.store.delete('_webhook_subscription');
    }
  },
  async run(ctx) {
    return [ctx.payload.body];
  },
  async test(ctx) {
    return [ctx.propsValue];
  },
});
