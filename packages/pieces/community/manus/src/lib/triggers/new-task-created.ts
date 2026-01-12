import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { manusAuth } from '../common/auth';

export const newTaskCreated = createTrigger({
  name: 'new_task_created',
  displayName: 'New Task Created',
  description: 'Triggers when a new task is successfully created in Manus',
  props: {},
  auth: manusAuth,
  sampleData: {
    event_id: "task_created_task_abc123",
    event_type: "task_created",
    task_detail: {
      task_id: "task_abc123",
      task_title: "Generate quarterly sales report",
      task_url: "https://manus.im/app/task_abc123"
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ webhookUrl, store, auth }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.manus.ai/v1/webhooks',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'API_KEY': auth.secret_text,
        },
        body: {
          webhook: {
            url: webhookUrl,
          },
        },
      });

      const webhookId = response.body.webhook_id;
      await store.put('webhook_id', webhookId);
      await store.put('webhook_url', webhookUrl);
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error}`);
    }
  },
  async onDisable({ store, auth }) {
    try {
      const webhookId = await store.get('webhook_id');
      if (webhookId) {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `https://api.manus.ai/v1/webhooks/${webhookId}`,
          headers: {
            'accept': 'application/json',
            'API_KEY': auth.secret_text,
          },
        });
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body as any;

    if (!payload || payload.event_type !== 'task_created') {
      return [];
    }

    return [payload];
  },
});
