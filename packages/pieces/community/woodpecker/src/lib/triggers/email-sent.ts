import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const emailSent = createTrigger({
  auth: woodpeckerAuth,
  name: 'email_sent',
  displayName: 'Campaign Email Sent',
  description: 'Triggers when a campaign email is sent to a prospect',
  props: {},
  sampleData: {
    method: 'email_sent',
    prospect: {
      id: 1234567890,
      email: 'erlich@bachmanity.com',
      first_name: 'Erlich',
      last_name: 'Bachman',
      company: 'Bachmanity',
      campaign_id: 123456,
      campaign_name: 'SaaS in America',
    },
    timestamp: '2025-03-21T20:47:47+0100',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.EMAIL_SENT
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.EMAIL_SENT
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
