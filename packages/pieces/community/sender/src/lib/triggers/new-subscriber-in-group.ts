import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const newSubscriberInGroupTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_subscriber_in_group',
  displayName: 'New Subscriber in Group',
  description: 'Fires when a subscriber is added to a specific group/list',
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
      topic : 'groups/new-subscriber',
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
    const groupId = context.propsValue.groupId;
    const response = await makeSenderRequest(
      context.auth,
      `/groups/${groupId}/subscribers?limit=1`
    );
    return response.body.data || [];
  },
  sampleData: {},
});
