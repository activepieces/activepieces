import { Property } from '@activepieces/pieces-framework';
import { wrikeAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
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
      description: 'Optional: Only trigger for subtasks created under this specific parent task',
      required: false,
    }),
  },
  sampleData: {
    id: 'IEAAAAAQKQ',
    title: 'Sample Subtask',
    description: 'This is a sample subtask description',
    status: 'New',
    importance: 'Normal',
    createdDate: '2024-01-15T10:00:00Z',
    updatedDate: '2024-01-15T10:00:00Z',
    dates: {
      start: '2024-01-15T10:00:00Z',
      due: '2024-01-20T17:00:00Z',
    },
    responsibles: ['IEAAAAAQKQ'],
    authorId: 'IEAAAAAQKQ',
    parentIds: ['IEAAAAAQKQ'],
    superTaskIds: ['IEAAAAAQKQ'],
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;
    const { parentTaskId } = context.propsValue;

    const webhookData: Record<string, any> = {
      hookUrl: webhookUrl,
      hookEvents: ['subtask_created'],
      hookName: `ActivePieces New Subtask Webhook${parentTaskId ? ` - Parent ${parentTaskId}` : ''}`,
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
      throw new Error(`Failed to register webhook. Status: ${status}, Body: ${JSON.stringify(body)}`);
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

    if (payload && payload.taskId) {
      try {
        const subtaskDetails = await wrikeCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/tasks/${payload.taskId}`,
        });

        return [subtaskDetails.body.data[0]];
      } catch (error) {
        console.warn('Failed to fetch subtask details:', error);
        return [payload];
      }
    }

    return [payload];
  },
});
