import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';

const TOPIC = 'campaigns/new';
const STORE_KEY = 'webhookId';

export const newCampaignTrigger = createTrigger({
  auth: senderAuth,
  name: 'new_campaign',
  classification: 'READ',
  displayName: 'New Campaign',
  description: 'Fires when a new campaign is created in Sender',
  aiMetadata: {
    description: 'Fires when a new campaign is created in the connected Sender account, representing the newly created campaign (including drafts).',
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
    const page = await senderApi.listCampaigns({ auth: context.auth, limit: 1 });
    return page.data ?? [];
  },
  sampleData: {},
});
