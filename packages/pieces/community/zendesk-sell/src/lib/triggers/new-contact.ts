import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Contact } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const newContactTrigger = createTrigger({
  auth: zendeskSellAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created in Zendesk Sell',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 1,
    name: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    mobile: '+1234567891',
    title: 'Sales Manager',
    description: 'Key contact at company',
    organization_name: 'Example Corp',
    owner_id: 100,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const webhookData = {
      data: {
        target_url: webhookUrl,
        resource_type: 'contact',
        event_type: 'created',
        active: true,
      },
    };

    const response = await makeZendeskSellRequest<{ data: { id: number } }>(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      webhookData
    );

    await context.store.put('webhookId', response.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<number>('webhookId');
    
    if (webhookId) {
      await makeZendeskSellRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
      await context.store.delete('webhookId');
    }
  },
  async run(context) {
    const payload = context.payload.body as any;
    if (payload.data && payload.meta?.type === 'contact') {
      return [
        {
          data: {
            contact: payload.data,
          },
        },
      ];
    }

    return [];
  },
});
