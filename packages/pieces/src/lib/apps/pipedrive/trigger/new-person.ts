import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { pipedriveCommon } from '../common';

export const newPerson = createTrigger({
  name: 'new_person',
  displayName: 'New Person',
  description: 'Triggers when a new person is created',
  props: {
    authentication: pipedriveCommon.authentication,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await pipedriveCommon.subscribeWebhook('person', 'added', context.webhookUrl!, context.propsValue['authentication']!.data['api_domain'], context.propsValue['authentication']!.access_token);
    await context.store?.save<WebhookInformation>('_new_person_trigger', {
      webhookId: webhook.data.id
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>('_new_person_trigger');
    if (response !== null && response !== undefined) {
      const webhook = await pipedriveCommon.unsubscribeWebhook(response.webhookId, context.propsValue['authentication']!.data['api_domain'], context.propsValue['authentication']!.access_token);
    }
  },
  async run(context) {
    return [context.payload.current];
  },
});

interface WebhookInformation {
  webhookId: string;
}