import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Deal } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const newDealTrigger = createTrigger({
  auth: zendeskSellAuth,
  name: 'new_deal',
  displayName: 'New Deal',
  description: 'Fires when a new deal is created',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 1,
    name: 'Enterprise Software Deal',
    value: 50000,
    currency: 'USD',
    hot: true,
    stage_id: 1,
    contact_id: 100,
    owner_id: 10,
    estimated_close_date: '2025-03-01',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      data: {
        target_url: webhookUrl,
        resource_type: 'deal',
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
    
    if (payload.data && payload.meta?.type === 'deal') {
      return [
        {
          data: {
            deal: payload.data,
          },
        },
      ];
    }

    return [];
  },
});
