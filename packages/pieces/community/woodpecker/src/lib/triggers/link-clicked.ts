import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const linkClicked = createTrigger({
  auth: woodpeckerAuth,
  name: 'link_clicked',
  displayName: 'Prospect Clicked a Link',
  description: 'Triggers when a prospect clicks a link in an email',
  props: {},
  sampleData: {
    method: 'link_clicked',
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
      WEBHOOK_EVENTS.LINK_CLICKED
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.LINK_CLICKED
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
