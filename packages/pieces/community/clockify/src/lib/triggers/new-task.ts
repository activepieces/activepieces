import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const newTaskTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project',
      required: true,
    }),
  },
  sampleData: {
    id: '123456',
    name: 'Sample Task',
    projectId: 'project123',
    assigneeIds: ['user123'],
    estimate: '3600',
    status: 'ACTIVE',
    createdAt: '2023-01-01T00:00:00Z'
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Create a webhook in Clockify for task creation events
    const { workspaceId, projectId } = context.propsValue;

    const webhook = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/webhooks`,
      {
        name: `Activepieces New Task Trigger`,
        url: context.webhookUrl,
        triggerSource: 'TASK',
        triggerEvent: 'NEW',
        projectIds: [projectId]
      }
    );

    await context.store.put('webhookId', webhook.id);
  },
  async onDisable(context) {
    // Delete the webhook when the trigger is disabled
    const webhookId = await context.store.get('webhookId');
    const { workspaceId } = context.propsValue;

    if (webhookId) {
      await makeRequest(
        context.auth as string,
        HttpMethod.DELETE,
        `/workspaces/${workspaceId}/webhooks/${webhookId}`
      );
    }
  },
  async run(context) {
    // Process the webhook payload
    // When a new task is created, Clockify will send a webhook to the registered URL

    if (!context.payload) {
      return [];
    }

    // Extract the task data from the payload
    const taskData = context.payload.body || context.payload;

    // Generate a unique ID for the task
    const uniqueId = typeof taskData === 'object' && taskData !== null && 'id' in taskData
      ? (taskData as any).id
      : new Date().toISOString();

    return [
      {
        id: uniqueId,
        payload: taskData,
      },
    ];
  },
});
