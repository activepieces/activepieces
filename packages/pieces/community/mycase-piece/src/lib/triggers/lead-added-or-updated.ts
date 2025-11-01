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

export const leadAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'lead_added_or_updated',
  displayName: 'Lead Added or Updated',
  description: 'Triggers when a lead has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    email: 'lead@example.com',
    first_name: 'Jane',
    middle_initial: 'M',
    last_name: 'Smith',
    address: {
      address1: '789 Lead St',
      address2: 'Apt 3',
      city: 'Chicago',
      state: 'IL',
      zip_code: '60601',
      country: 'USA',
    },
    cell_phone_number: '555-123-4567',
    work_phone_number: '555-987-6543',
    home_phone_number: '555-111-2222',
    lead_details: 'Potential client for personal injury case',
    birthdate: '1985-03-20',
    drivers_license_number: 'D1234567',
    drivers_license_state: 'IL',
    status: 'New',
    approved: false,
    referral_source_reference: {
      id: 1,
    },
    referred_by: {
      id: 100,
    },
    custom_field_values: [],
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(ctx) {
    const api = createMyCaseApi(ctx.auth);

    const requestBody = {
      model: 'lead',
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
