import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { pipedriveCommon } from '../common';

export const newActivity = createTrigger({
  name: 'new_activity',
  displayName: 'New Activity',
  description: 'Triggers when a new activity is added',
  props: {
    authentication: pipedriveCommon.authentication,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await pipedriveCommon.subscribeWebhook('activity', 'added', context.webhookUrl!, context.propsValue['authentication']!.data.api_domain, context.propsValue['authentication']!.access_token);
    await context.store?.save<WebhookInformation>('_new_activity_trigger', {
      webhookId: webhook.data.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_new_activity_trigger');
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