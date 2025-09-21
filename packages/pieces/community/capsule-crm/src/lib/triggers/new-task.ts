import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const newTaskTrigger = createTrigger({
  auth: capsuleCrmAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created.',
  props: {},
  sampleData: {
    event: 'task-created',
    task: {
      id: 401,
      description: 'Follow up with Jane Doe',
      dueOn: '2024-12-15',
      party: {
        id: 101,
        type: 'person',
        name: 'Jane Doe',
      },
      owner: {
        id: 1,
        username: 'johntest',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await capsuleCrmClient.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      'task-created' 
    );
    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<number>('webhookId');
    if (webhookId) {
      await capsuleCrmClient.unsubscribeWebhook(context.auth, webhookId);
    }
  },

  async run(context) {
    const payload = context.payload.body as { task: unknown };
    return [payload.task];
  },
});
