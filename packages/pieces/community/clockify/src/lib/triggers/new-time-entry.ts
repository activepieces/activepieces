import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const newTimeEntryTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_time_entry',
  displayName: 'New Time Entry',
  description: 'Triggers when a new time entry is created in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project (leave empty to trigger for all projects)',
      required: false,
    }),
  },
  sampleData: {
    id: '456789',
    description: 'Working on Project X',
    userId: 'user123',
    workspaceId: 'workspace123',
    projectId: 'project123',
    timeInterval: {
      start: '2023-01-01T09:00:00Z',
      end: '2023-01-01T17:00:00Z',
      duration: '28800'
    },
    billable: true,
    tagIds: ['tag123']
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Create a webhook in Clockify for time entry creation events
    const { workspaceId, projectId } = context.propsValue;

    const webhookData: Record<string, any> = {
      name: `Activepieces Time Entry Trigger`,
      url: context.webhookUrl,
      triggerSource: 'TIME_ENTRY',
      triggerEvent: 'CREATED',
    };

    // If a specific project is selected, add it to the webhook configuration
    if (projectId) {
      webhookData['projectIds'] = [projectId];
    }

    const webhook = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/webhooks`,
      webhookData
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
    // When a new time entry is created, Clockify will send a webhook to the registered URL

    if (!context.payload) {
      return [];
    }

    // Extract the time entry data from the payload
    const timeEntryData = context.payload.body || context.payload;

    // Generate a unique ID for the time entry
    const uniqueId = typeof timeEntryData === 'object' && timeEntryData !== null && 'id' in timeEntryData
      ? (timeEntryData as any).id
      : new Date().toISOString();

    return [
      {
        id: uniqueId,
        payload: timeEntryData,
      },
    ];
  },
});
