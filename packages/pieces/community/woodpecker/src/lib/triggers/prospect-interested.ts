import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const prospectInterested = createTrigger({
  auth: woodpeckerAuth,
  name: 'prospect_interested',
  displayName: 'Prospect Interested',
  description: 'Triggers when a prospect is marked as interested',
  props: {},
  sampleData: {
    method: 'prospect_interested',
    prospect: {
      id: 1234567890,
      email: 'erlich@bachmanity.com',
      first_name: 'Erlich',
      last_name: 'Bachman',
      company: 'Bachmanity',
      interested: 'INTERESTED',
    },
    timestamp: '2025-03-21T20:47:47+0100',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_INTERESTED
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_INTERESTED
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
