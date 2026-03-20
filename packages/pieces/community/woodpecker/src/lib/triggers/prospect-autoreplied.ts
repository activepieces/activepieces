import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const prospectAutoreplied = createTrigger({
  auth: woodpeckerAuth,
  name: 'prospect_autoreplied',
  displayName: 'Prospect Autoreplied',
  description: 'Triggers when an autoreply is detected from a prospect',
  props: {},
  sampleData: {
    method: 'prospect_autoreplied',
    prospect: {
      id: 1234567890,
      email: 'erlich@bachmanity.com',
      first_name: 'Erlich',
      last_name: 'Bachman',
      company: 'Bachmanity',
      status: 'AUTOREPLIED',
    },
    timestamp: '2025-03-21T20:47:47+0100',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_AUTOREPLIED
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_AUTOREPLIED
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
