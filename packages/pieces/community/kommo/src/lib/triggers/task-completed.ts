import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const taskCompletedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggered when a task is marked as completed.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 555555,
    text: 'Follow-up Call',
    is_completed: true,
  },
  async onEnable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const webhook = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.POST,
      `/webhooks`,
      {
        destination: context.webhookUrl,
        settings: { events: ['task_completed'] }
      }
    );

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(
        { subdomain, apiToken },
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    return [{
      id: Date.now().toString(),
      data: context.payload.body,
    }];
  },
});
