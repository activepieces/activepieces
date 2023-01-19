import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { pipedriveCommon } from '../common';

export const updatedDeal = createTrigger({
  name: 'updated_deal',
  displayName: 'Updated Deal',
  description: 'Triggers when a deal is updated',
  props: {
    authentication: pipedriveCommon.authentication,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await pipedriveCommon.subscribeWebhook('deal', 'updated', context.webhookUrl!, context.propsValue['authentication']!.data.api_domain, context.propsValue['authentication']!.access_token);
    await context.store?.save<WebhookInformation>('_updated_deal_trigger', {
      webhookId: webhook.data.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_updated_deal_trigger');
    if (response !== null && response !== undefined) {
      const webhook = await pipedriveCommon.unsubscribeWebhook(response.webhookId, context.propsValue['authentication']!.data.api_domain, context.propsValue['authentication']!.access_token);
    }
  },
  async run(context) {
    return [context.payload.current];
  },
});

interface WebhookInformation {
  webhookId: string;
}