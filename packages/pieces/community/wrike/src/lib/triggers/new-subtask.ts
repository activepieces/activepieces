import { Property } from '@activepieces/pieces-framework';
import { wrikeAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wrikeCommon } from '../common/client';

export const newSubtask = createTrigger({
  name: 'new_subtask_created',
  displayName: 'New Subtask Created',
  description: 'Triggers when a subtask is created.',
  auth: wrikeAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    parentTaskId: Property.ShortText({
      displayName: 'Parent Task ID',
      description:
        'Optional: Only trigger for subtasks created under this specific parent task',
      required: false,
    }),
  },
  sampleData: {
    addedParents: ['IEAAABDCI4AB5FLD', 'IEAAABDCI4AB5FLE'],
    taskId: 'IEAAABDCKQAB5FLC',
    webhookId: 'IEAAABDCJAAAABAW',
    eventAuthorId: 'KUAAABKY',
    eventType: 'TaskParentsAdded',
    lastUpdatedDate: '2024-09-05T07:22:25Z',
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const { parentTaskId } = context.propsValue;

    const webhookData: Record<string, any> = {
      hookUrl: webhookUrl,
    };

    if (parentTaskId) {
      webhookData['taskId'] = parentTaskId;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${wrikeCommon.baseUrl}/webhooks`,
      body: webhookData,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const { status, body } = await httpClient.sendRequest(request);
    if (status !== 200) {
      throw new Error(
        `Failed to register webhook. Status: ${status}, Body: ${JSON.stringify(
          body
        )}`
      );
    }

    await context.store.put('webhook_id', body.data[0].id);
  },

  onDisable: async (context) => {
    const webhookId = await context.store.get('webhook_id');

    if (webhookId) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${wrikeCommon.baseUrl}/webhooks/${webhookId}`,
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
        },
      };

      try {
        await httpClient.sendRequest(request);
        await context.store.delete('webhook_id');
      } catch (error) {
        console.warn('Failed to unregister webhook:', error);
      }
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;

    if (payload && payload.eventType === 'TaskParentsAdded') {
      return payload;
    }

    return [payload];
  },
});
