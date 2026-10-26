import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';

const TOPIC = 'groups/new';
const STORE_KEY = 'webhookId';

export const newGroupTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_group',
  classification: 'READ',
  displayName: 'New Group',
  description: 'Fires when a new group/list is created',
  aiMetadata: {
    description: 'Fires when a new subscriber group/list is created in the connected Sender account, representing the newly created group.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhook = await senderApi.createWebhook({
      auth: context.auth,
      url: context.webhookUrl,
      topic: TOPIC,
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
    const page = await senderApi.listGroups({ auth: context.auth, limit: 1 });
    return page.data ?? [];
  },
  sampleData: {},
});
