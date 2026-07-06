import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { digitalPilotAuth } from '../auth';
import { makeClient, tagIdProp } from '../common';

export const newTargetAccountVisitTrigger = createTrigger({
  auth: digitalPilotAuth,
  name: 'new_target_account_visit',
  displayName: 'New Target Account Visit',
  description: 'Triggers when a business you\'ve identified as a high-priority target account browses your site',
  aiMetadata: {
    description: 'Fires when a business already on one of your DigitalPilot target-account lists (for the configured tag) visits your website. Each event represents one such visit and carries the account domain and engagement signals (page views, time on site, pages visited). Use to react to activity from accounts you are specifically targeting, as opposed to any high-intent visitor.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    tagId: tagIdProp,
  },
  sampleData: {
    domain: 'acme-corp.com',
    timestamp: '2024-01-15T14:22:00Z',
    page_views: 8,
    time_on_site: 320,
    pages_visited: [
      '/products',
      '/pricing',
      '/contact'
    ],
  },

  async onEnable(context) {
    const client = makeClient(context.auth.secret_text);
    const webhookUrl = context.webhookUrl;

    const webhook = await client.createWebhook(
      context.propsValue.tagId,
      webhookUrl,
      'target_accounts'
    );

    await context.store.put('_webhook_id', webhook.id);
  },

  async onDisable(context) {
    const client = makeClient(context.auth.secret_text);
    const webhookId = await context.store.get<string>('_webhook_id');

    if (webhookId) {
      await client.deleteWebhook(
        context.propsValue.tagId,
        undefined,
        webhookId
      );
    }
  },

  async run(context) {
    return [context.payload.body];
  },
});
