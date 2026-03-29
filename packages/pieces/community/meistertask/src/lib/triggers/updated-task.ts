import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../auth';

export const updatedTask = createTrigger({
  auth: meistertaskAuth,
  name: 'updated_task',
  displayName: 'Updated Task',
  description: 'Triggers when a task is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const response = await fetch('https://www.meistertask.com/api/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: context.webhookUrl,
        events: ['task.updated'],
      }),
    });
    const webhook = await response.json();
    await context.store.put('webhook_id', webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhook_id');
    if (webhookId) {
      await fetch(`https://www.meistertask.com/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${context.auth}` },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
