import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { woodpeckerAuth } from '../..';
import { WEBHOOK_EVENTS, subscribeWebhook, unsubscribeWebhook } from '../common';

export const taskIgnored = createTrigger({
  auth: woodpeckerAuth,
  name: 'task_ignored',
  displayName: 'Task Ignored',
  description: 'Triggers when a task is ignored',
  props: {},
  sampleData: {
    method: 'task_ignored',
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
      WEBHOOK_EVENTS.TASK_IGNORED
    );
  },
  async onDisable(context) {
    await unsubscribeWebhook(
      context.auth.secret_text,
      context.webhookUrl,
      WEBHOOK_EVENTS.TASK_IGNORED
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});
