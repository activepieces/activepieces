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

export const companyAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'company_added_or_updated',
  displayName: 'Company Added or Updated',
  description: 'Triggers when a company has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    name: 'Acme Corporation',
    email: 'contact@acmecorp.com',
    website: 'https://www.acmecorp.com',
    main_phone_number: '555-123-4567',
    fax_phone_number: '555-987-6543',
    address: {
      address1: '456 Business Ave',
      address2: 'Floor 5',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      country: 'USA',
    },
    notes: 'Important company notes',
    cases: [
      {
        id: 100,
      },
    ],
    clients: [
      {
        id: 200,
      },
    ],
    custom_field_values: [],
    archived: false,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(ctx) {
    const api = createMyCaseApi(ctx.auth);

    const requestBody = {
      model: 'company',
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
