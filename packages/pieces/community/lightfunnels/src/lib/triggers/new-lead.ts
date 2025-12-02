import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const newLeadTrigger = createTrigger({
  auth: lightfunnelsAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead subscribes',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    node: {
      id: 'cust_123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      accepts_marketing: true,
      orders_count: 1,
      total_spent: 100,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  },
  async onEnable(context) {
    const query = `
      mutation CreateWebhookMutation($node: WebhookInput!) {
        createWebhook(node: $node) {
          id
          type
          settings
          url
        }
      }
    `;

    const variables = {
      node: {
        type: 'contact/signup',
        url: context.webhookUrl,
        settings: {},
      },
    };

    const response = await lightfunnelsCommon.makeGraphQLRequest<{ createWebhook: { id: string } }>(
      context.auth,
      query,
      variables
    );

    await context.store.put('webhook_id', response.data.createWebhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhook_id');
    if (webhookId) {
      const query = `
        mutation webhooksDeleteMutation($id: ID!) {
          deleteWebhook(id: $id)
        }
      `;

      await lightfunnelsCommon.makeGraphQLRequest(
        context.auth,
        query,
        { id: webhookId }
      );

      await context.store.delete('webhook_id');
    }
  },
  async run(context) {
    const payload = context.payload.body as { node: any };
    return [payload.node];
  },
});
