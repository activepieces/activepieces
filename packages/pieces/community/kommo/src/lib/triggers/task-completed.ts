import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';
import { KOMMO_WEBHOOK_EVENTS } from '../common';

export const taskCompletedTrigger = createTrigger({
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggers when a user marks a task as complete',
  props: {
    element_type: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Filter tasks by entity type',
      required: false,
      options: {
        options: [
          { label: 'All', value: '0' },
          { label: 'Contact', value: '1' },
          { label: 'Lead', value: '2' },
          { label: 'Company', value: '3' },
        ],
      },
      defaultValue: '0',
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  auth: kommoAuth,
  sampleData: {
    id: 1234567,
    element_id: 12345678,
    element_type: 2,
    task_type: 1,
    text: 'Task text',
    status: 1,
    responsible_user_id: 11111111,
    complete_till: '2024-10-23 20:59:00',
    created_at: 1726579225,
    updated_at: 1726579269,
  },
  async onEnable(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);

    // Create webhook subscription
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: getApiUrl(context.auth, 'webhooks'),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        destination: context.webhookUrl,
        settings: [
          {
            entity_type: 'task',
            event: KOMMO_WEBHOOK_EVENTS.TASK_COMPLETED,
          },
        ],
      },
    });

    // Store webhook ID for later deletion
    await context.store.put('webhook_id', response.body.id);
  },

  async onDisable(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const webhookId = await context.store.get('webhook_id');

    if (webhookId) {
      // Delete webhook subscription
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: getApiUrl(context.auth, `webhooks/${webhookId}`),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as Record<string, any>;
    const { element_type } = context.propsValue;

    // Check if the payload contains task updates
    if (payload?.task?.update && Array.isArray(payload.task.update)) {
      // Filter for completed tasks (status = 1)
      const completedTasks = payload.task.update.filter((task: any) => task.status === '1' || task.status === 1);

      // If element_type is provided and not '0', filter tasks by that type
      if (element_type && element_type !== '0') {
        return completedTasks.filter((task: any) =>
          task.element_type === parseInt(element_type) ||
          task.element_type === element_type
        );
      }

      return completedTasks;
    }

    return [];
  },
});
