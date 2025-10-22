import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const newUnsubscriberFromGroupTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_unsubscriber_from_group',
  displayName: 'New Unsubscriber From Group',
  description: 'Fires when a subscriber is removed/unsubscribed from a specific group',
  type: TriggerStrategy.WEBHOOK,
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The ID of the group to monitor',
      required: true,
    }),
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const groupId = context.propsValue.groupId;
    
    const webhookData = {
      url: webhookUrl,
      topic: 'groups/unsubscribed',
      relation_id : groupId,
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