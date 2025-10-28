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

export const personAddedOrUpdated = createTrigger({
  auth: mycaseAuth,
  name: 'person_added_or_updated',
  displayName: 'Person Added or Updated',
  description: 'Triggers when a person has been added or updated',
  props: {},
  sampleData: {
    id: 12345,
    email: 'john.doe@example.com',
    first_name: 'John',
    middle_name: 'Michael',
    last_name: 'Doe',
    address: {
      address1: '123 Main St',
      address2: 'Suite 100',
      city: 'Los Angeles',
      state: 'CA',
      zip_code: '90001',
      country: 'USA',
    },
    cell_phone_number: '555-123-4567',
    work_phone_number: '555-987-6543',
    home_phone_number: '555-111-2222',
    fax_phone_number: '555-333-4444',
    contact_group: 'Client',
    people_group: {
      id: 1,
    },
    notes: 'Important client notes',
    birthdate: '1980-05-15',
    archived: false,
    cases: [
      {
        id: 100,
      },
    ],
    custom_field_values: [],
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(ctx) {
    const api = createMyCaseApi(ctx.auth);

    const requestBody = {
      model: 'client',
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
