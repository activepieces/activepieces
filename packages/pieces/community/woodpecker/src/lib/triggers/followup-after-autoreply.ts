import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const followupAfterAutoreply = createTrigger({
  auth: woodpeckerAuth,
  name: 'followup_after_autoreply',
  displayName: 'Follow-up After Autoreply',
  description: 'Triggers when a follow-up is scheduled after an autoreply',
  props: {},
  sampleData: {
    method: 'followup_after_autoreply',
    prospect: {
      id: 1234567890,
      email: 'erlich@bachmanity.com',
      first_name: 'Erlich',
      last_name: 'Bachman',
      company: 'Bachmanity',
    },
    timestamp: '2025-03-21T20:47:47+0100',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.FOLLOWUP_AFTER_AUTOREPLY
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.FOLLOWUP_AFTER_AUTOREPLY
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
