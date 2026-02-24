import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const prospectOptout = createTrigger({
  auth: woodpeckerAuth,
  name: 'prospect_optout',
  displayName: 'Prospect Opt-out',
  description: 'Triggers when a prospect opts out from receiving emails',
  props: {},
  sampleData: {
    method: 'prospect_optout',
    prospect: {
      id: 1234567890,
      email: 'erlich@bachmanity.com',
      first_name: 'Erlich',
      last_name: 'Bachman',
      company: 'Bachmanity',
      status: 'OPTOUT',
    },
    timestamp: '2025-03-21T20:47:47+0100',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await subscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_OPTOUT
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.PROSPECT_OPTOUT
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
