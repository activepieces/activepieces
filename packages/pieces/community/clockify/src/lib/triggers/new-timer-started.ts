import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';
import { clockifyCommon } from '../common/props';

export const newTimerStartedTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_timer_started',
  displayName: 'New Timer Started',
  description: 'Triggers when a new timer is started in Clockify',
  props: {
    workspaceId: clockifyCommon.workspace_id(),
    projectId: clockifyCommon.project_id(false),
  },
  sampleData: {
    id: '987654',
    description: 'Working on Feature Y',
    userId: 'user123',
    workspaceId: 'workspace123',
    projectId: 'project123',
    timeInterval: {
      start: '2023-01-01T14:00:00Z',
      duration: null
    },
    billable: true,
    isRunning: true
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Create a webhook in Clockify for timer started events
    const { workspaceId, projectId } = context.propsValue;

    const webhookData: Record<string, any> = {
      name: `Activepieces Timer Started Trigger`,
      url: context.webhookUrl,
      triggerSource: 'TIMER',
      triggerEvent: 'STARTED',
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
    // When a timer is started, Clockify will send a webhook to the registered URL

    if (!context.payload) {
      return [];
    }

    // Extract the timer data from the payload
    const timerData = context.payload.body || context.payload;

    // Generate a unique ID for the timer
    const uniqueId = typeof timerData === 'object' && timerData !== null && 'id' in timerData
      ? (timerData as any).id
      : new Date().toISOString();

    return [
      {
        id: uniqueId,
        payload: timerData,
      },
    ];
  },
});
