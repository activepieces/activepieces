import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderSubscriberTriggerOutputSchema } from '../output-schemas';

const TOPIC = 'subscribers/updated';
const STORE_KEY = 'webhookId';

export const updatedSubscriberTrigger = createTrigger({
  auth: senderAuth,
  name: 'updated_subscriber',
  outputSchema: senderSubscriberTriggerOutputSchema,
  classification: 'READ',
  displayName: 'Updated Subscriber',
  description: "Fires when a subscriber's data (fields) is updated",
  aiMetadata: {
    description: "Fires when an existing subscriber's data or custom fields are updated in the connected Sender account, representing the changed contact.",
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
    const page = await senderApi.listSubscribers({ auth: context.auth, limit: 1 });
    return page.data ?? [];
  },
  sampleData: {},
});
