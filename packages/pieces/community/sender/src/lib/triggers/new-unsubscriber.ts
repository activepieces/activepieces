import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const newUnsubscriberTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_unsubscriber',
  displayName: 'New Unsubscriber',
  description: 'Fires when someone unsubscribes globally',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      url: webhookUrl,
      topic: 'subscribers/unsubscribed',
    };

    const response = await makeSenderRequest(
      context.auth,
      '/account/webhooks',
      HttpMethod.POST,
      webhookData
    );

    await context.store.put('webhookId', response.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    
    if (webhookId) {
      await makeSenderRequest(
        context.auth,
        `/account/webhooks/${webhookId}`,
        HttpMethod.DELETE
      );
    }
    
    await context.store.delete('webhookId');
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    return [];
  },
  sampleData: {},
});