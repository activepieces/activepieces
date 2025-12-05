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
      id: 'cus_dummy_id',
      __typename: 'Customer',
      email: 'dummy@example.com',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      phone: '+1 00000-00000',
      location: 'US',
      avatar: '//www.gravatar.com/avatar/00000000000000000000000000000000',
      notes: 'Sample customer notes',
      accepts_marketing: false,
      custom: {},
      tags: [],
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'dummy@example.com',
        phone: '+1 00000-00000',
        line1: '123 Dummy Street',
        line2: '',
        country: 'US',
        city: 'Sample City',
        area: '',
        zip: '000000',
        state: 'CA',
      },
      billing_address: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'dummy@example.com',
        phone: '+1 00000-00000',
        line1: '123 Dummy Street',
        line2: '',
        country: 'US',
        city: 'Sample City',
        area: '',
        zip: '000000',
        state: 'CA',
      },
      leads: [],
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

    const response = await lightfunnelsCommon.makeGraphQLRequest<{
      createWebhook: { id: string };
    }>(context.auth, query, variables);

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

      await lightfunnelsCommon.makeGraphQLRequest(context.auth, query, {
        id: webhookId,
      });

      await context.store.delete('webhook_id');
    }
  },
  async run(context) {
    const payload = context.payload.body as { node: any };
    return [payload.node];
  },
});
