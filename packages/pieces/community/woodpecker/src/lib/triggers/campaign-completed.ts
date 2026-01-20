import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const campaignCompleted = createTrigger({
  auth: woodpeckerAuth,
  name: 'campaign_completed',
  displayName: 'Campaign Completed',
  description: 'Triggers when a campaign is completed',
  props: {},
  sampleData: {
    method: 'campaign_completed',
    campaign: {
      id: 123456,
      name: 'SaaS in America',
    },
    timestamp: '2025-03-21T20:47:47+0100',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.CAMPAIGN_COMPLETED
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.CAMPAIGN_COMPLETED
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
