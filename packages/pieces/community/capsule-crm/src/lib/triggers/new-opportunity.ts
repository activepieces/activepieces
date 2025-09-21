import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const newOpportunityTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Fires when a new opportunity is created.',
  props: {},
  sampleData: {
    event: 'opportunity-created',
    opportunity: {
      id: 205,
      name: 'New Website Redesign Project',
      milestone: {
        id: 1,
        name: 'Lead',
      },
      party: {
        id: 101,
        type: 'organisation',
        name: 'Global Corp Inc.',
      },
      value: {
        currency: 'USD',
        amount: 7500,
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await capsuleCrmClient.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      'opportunity-created' 
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
    const payload = context.payload.body as { opportunity: unknown };
    return [payload.opportunity];
  },
});
