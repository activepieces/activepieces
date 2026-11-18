import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderSubscriberTriggerOutputSchema } from '../output-schemas';

const TOPIC = 'subscribers/new';
const STORE_KEY = 'webhookId';

export const newSubscriberTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_subscriber',
  outputSchema: senderSubscriberTriggerOutputSchema,
  classification: 'READ',
  displayName: 'New Subscriber',
  description: 'Fires when a subscriber is added to any group or to account',
  aiMetadata: {
    description: 'Fires when a new subscriber is added anywhere in the connected Sender account (to any group or to the account directly), representing the new contact.',
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
