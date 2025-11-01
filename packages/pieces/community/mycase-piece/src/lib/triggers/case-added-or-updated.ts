import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

interface WebhookSubscription {
  id: string;
  hmac_key: string;
}

export const caseAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'case_added_or_updated',
  displayName: 'Case Added or Updated',
  description: 'Triggers when a case has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    name: 'Sample Case',
    case_number: 'CASE-001',
    description: 'Sample case description',
    opened_date: '2024-01-01',
    closed_date: null,
    sol_date: null,
    practice_area: 'Personal Injury',
    case_stage: 'Discovery',
    status: 'open',
    outstanding_balance: 5000,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(ctx) {
    const api = createMyCaseApi(ctx.auth);

    const requestBody = {
      model: 'case',
      url: ctx.webhookUrl,
      actions: ['created', 'updated']
    };

    const response = await api.post('/webhooks/subscriptions', requestBody);

    if (response.success && response.data) {
      await ctx.store.put<WebhookSubscription>('_webhook_subscription', {
        id: response.data.id,
        hmac_key: response.data.hmac_key
      });
    } else {
      throw new Error(
        `Failed to create webhook subscription: ${response.error}`
      );
    }
  },
  async onDisable(ctx) {
    const subscription = await ctx.store.get<WebhookSubscription>(
      '_webhook_subscription'
    );

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
  }
});
