import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const updatedSubscriberTrigger = createTrigger({
  auth: senderAuth,
  name: 'updated_subscriber',
  displayName: 'Updated Subscriber',
  description: 'Fires when a subscriber\'s data (fields) is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      url: webhookUrl,
      events: ['subscriber.updated'],
    };

    const response = await makeSenderRequest(
      context.auth,
      '/webhooks',
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
        `/webhooks/${webhookId}`,
        HttpMethod.DELETE
      );
    }
    
    await context.store.delete('webhookId');
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    const response = await makeSenderRequest(
      context.auth,
      '/subscribers?limit=1'
    );
    return response.body.data || [];
  },
  sampleData: {},
});