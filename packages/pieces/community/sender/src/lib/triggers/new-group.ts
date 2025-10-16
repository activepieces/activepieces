import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const newGroupTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_group',
  displayName: 'New Group',
  description: 'Fires when a new group/list is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      url: webhookUrl,
      topic : 'groups/new',
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
      '/groups?limit=1',
      HttpMethod.GET
    );
    return response.body.data || [];
  },
  sampleData: {},
});