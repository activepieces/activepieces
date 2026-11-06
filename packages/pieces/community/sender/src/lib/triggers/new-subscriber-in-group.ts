import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderSubscriberTriggerOutputSchema } from '../output-schemas';

const TOPIC = 'groups/new-subscriber';
const STORE_KEY = 'webhookId';

export const newSubscriberInGroupTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_subscriber_in_group',
  outputSchema: senderSubscriberTriggerOutputSchema,
  classification: 'READ',
  displayName: 'New Subscriber in Group',
  description: 'Fires when a subscriber is added to a specific group/list',
  aiMetadata: {
    description: 'Fires when a subscriber is added to one specific group/list (identified by group ID) in the connected Sender account, representing that contact joining the monitored group.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'The ID of the group to monitor',
      required: true,
    }),
  },
  async onEnable(context) {
    const webhook = await senderApi.createWebhook({
      auth: context.auth,
      url: context.webhookUrl,
      topic: TOPIC,
      relationId: context.propsValue.groupId,
    });
    await context.store.put(STORE_KEY, webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(STORE_KEY);
    if (webhookId) {
      await senderApi.deleteWebhook({ auth: context.auth, webhookId });
    }
    await context.store.delete(STORE_KEY);
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    const page = await senderApi.listGroupSubscribers({ auth: context.auth, groupId: context.propsValue.groupId, limit: 1 });
    return page.data ?? [];
  },
  sampleData: {},
});
