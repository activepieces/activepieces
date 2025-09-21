import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const newProjectTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Fires when a new project (case) is created in Capsule CRM.',
  props: {},
  sampleData: {
    event: 'kase-created',
    kase: {
      id: 301,
      name: 'Q1 Marketing Campaign',
      description: 'Launch campaign for the new product line.',
      party: {
        id: 101,
        type: 'organisation',
        name: 'Global Corp Inc.',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await capsuleCrmClient.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      'kase-created' 
    );
    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<number>('webhookId');
    if (webhookId) {
      await capsuleCrmClient.unsubscribeWebhook(context.auth, webhookId);
    }
  },

  async run(context) {
    const payload = context.payload.body as { kase: unknown };
    return [payload.kase];
  },
});
