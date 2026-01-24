import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { digitalPilotAuth } from '../../index';
import { makeClient, tagIdProp } from '../common';

export const newHighIntentVisitTrigger = createTrigger({
  auth: digitalPilotAuth,
  name: 'new_high_intent_visit',
  displayName: 'New High Intent Visit',
  description: 'Triggers when a business exhibits high intent behavior on your website',
  type: TriggerStrategy.WEBHOOK,
  props: {
    tagId: tagIdProp,
  },
  sampleData: {
    domain: 'example.com',
    timestamp: '2024-01-15T10:30:00Z',
    intent_score: 85,
    page_views: 12,
    time_on_site: 450,
  },

  async onEnable(context) {
    const client = makeClient(context.auth.secret_text);
    const webhookUrl = context.webhookUrl;

    const webhook = await client.createWebhook(
      context.propsValue.tagId,
      webhookUrl,
      'high_intent'
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
