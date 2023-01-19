import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { pipedriveCommon } from '../common';

export const updatedPerson = createTrigger({
  name: 'updated_person',
  displayName: 'Updated Person',
  description: 'Triggers when a person is updated',
  props: {
    authentication: pipedriveCommon.authentication,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await pipedriveCommon.subscribeWebhook('person', 'updated', context.webhookUrl!, context.propsValue['authentication']!.data.api_domain, context.propsValue['authentication']!.access_token);
    await context.store?.save<WebhookInformation>('_updated_person_trigger', {
      webhookId: webhook.data.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_updated_person_trigger');
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