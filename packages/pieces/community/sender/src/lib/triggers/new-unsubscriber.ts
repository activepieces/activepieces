import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderSubscriberTriggerOutputSchema } from '../output-schemas';

const TOPIC = 'subscribers/unsubscribed';
const STORE_KEY = 'webhookId';

export const newUnsubscriberTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_unsubscriber',
  outputSchema: senderSubscriberTriggerOutputSchema,
  classification: 'READ',
  displayName: 'New Unsubscriber',
  description: 'Fires when someone unsubscribes globally',
  aiMetadata: {
    description: 'Fires when a subscriber unsubscribes globally from the connected Sender account, representing the contact that opted out of all communications.',
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
  async test() {
    return [];
  },
  sampleData: {},
});
