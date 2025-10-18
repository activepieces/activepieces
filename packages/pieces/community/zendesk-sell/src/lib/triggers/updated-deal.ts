import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Deal } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatedDealTrigger = createTrigger({
  auth: zendeskSellAuth,
  name: 'updated_deal',
  displayName: 'Updated Deal',
  description: 'Fires when a deal is modified',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 1,
    name: 'Enterprise Software Deal',
    value: 75000,
    currency: 'USD',
    stage_id: 2,
    owner_id: 10,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      data: {
        target_url: webhookUrl,
        resource_type: 'deal',
        event_type: 'updated',
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