import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Deal } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const dealEntersNewStageTrigger = createTrigger({
  auth: zendeskSellAuth,
  name: 'deal_enters_new_stage',
  displayName: 'Deal Enters New Stage',
  description: 'Fires when a deal transitions into a specified pipeline stage',
  props: {
    stageId: Property.Number({
      displayName: 'Stage ID',
      description: 'The pipeline stage ID to monitor (leave empty to monitor all stage changes)',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 1,
    name: 'Enterprise Software Deal',
    value: 75000,
    currency: 'USD',
    stage_id: 3,
    previous_stage_id: 2,
    owner_id: 10,
    last_stage_change_at: '2025-01-02T00:00:00Z',
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
    await context.store.put('dealStages', {});
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
      await context.store.delete('dealStages');
    }
  },
  async run(context) {
    const payload = context.payload.body as any;

    if (payload.data && payload.meta?.type === 'deal') {
      const deal = payload.data as Deal;
      const dealStages = await context.store.get<Record<number, number>>('dealStages') || {};
      const previousStageId = dealStages[deal.id];
      const currentStageId = deal.stage_id;

      if (previousStageId !== undefined && previousStageId !== currentStageId) {
        dealStages[deal.id] = currentStageId;
        await context.store.put('dealStages', dealStages);
        if (!context.propsValue.stageId || currentStageId === context.propsValue.stageId) {
          return [
            {
              data: {
                deal: {
                  ...deal,
                  previous_stage_id: previousStageId,
                },
              },
            },
          ];
        }
      } else {
        dealStages[deal.id] = currentStageId;
        await context.store.put('dealStages', dealStages);
      }
    }

    return [];
  },
});