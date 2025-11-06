import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newSubscriberTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Fires when a subscriber is added to any group or to account',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    const webhookData = {
      url: webhookUrl,
      topic: 'subscribers/new',
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
    const response = await makeSenderRequest(
      context.auth,
      '/subscribers?limit=1',
      HttpMethod.GET
    );
    return response.body.data;
  },
  sampleData: {},
});
