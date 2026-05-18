import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const prospectReplied = createTrigger({
  auth: woodpeckerAuth,
  name: 'prospect_replied',
  displayName: 'Prospect Replied',
  description: 'Triggers when a prospect replies to an email or their status is manually set to RESPONDED',
  props: {},
  sampleData: {
    method: 'prospect_replied',
    prospect: {
      id: 1234567890,
      email: 'erlich@bachmanity.com',
      first_name: 'Erlich',
      last_name: 'Bachman',
      company: 'Bachmanity',
      status: 'REPLIED',
      campaign_id: 123456,
      campaign_name: 'SaaS in America',
    },
    email: {
      id: 191867492,
      subject: 'Reply message subject',
      message: 'reply content',
    },
    timestamp: '2025-03-21T20:47:47+0100',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_REPLIED
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_REPLIED
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
