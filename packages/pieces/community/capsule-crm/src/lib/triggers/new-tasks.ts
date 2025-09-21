import { capsuleAuth } from '../common/auth';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { capsuleCommon } from '../common/client';

export const newTasks = createTrigger({
  name: 'new_tasks',
  displayName: 'New Tasks',
  description: 'Triggers when a new task is created',
  auth: capsuleAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 12345,
    description: 'Follow up with client',
    detail: 'Call client to discuss project requirements',
    dueDate: '2023-08-01',
    status: 'OPEN',
    priority: 'NORMAL',
    category: 'Follow-up',
    party: {
      id: 67890,
      name: 'Jane Smith'
    },
    opportunity: {
      id: 111,
      name: 'New Sales Deal'
    },
    createdAt: '2023-07-27T10:00:00Z',
    updatedAt: '2023-07-27T10:00:00Z'
  },

  onEnable: async (context) => {
    const webhookUrl = context.webhookUrl;

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${capsuleCommon.baseUrl}/resthooks/subscribe`,
        body: {
          event: 'task.created',
          target_url: webhookUrl
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token
        }
      };

      const response = await httpClient.sendRequest(request);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Failed to subscribe to webhook. Status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to setup webhook: ${error}`);
    }
  },

  onDisable: async (context) => {
    const webhookUrl = context.webhookUrl;

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${capsuleCommon.baseUrl}/resthooks/unsubscribe`,
        body: {
          event: 'task.created',
          target_url: webhookUrl
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token
        }
      };

      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unsubscribe from webhook:', error);
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;

    let taskId: number | null = null;

    if (payload?.task?.id) {
      taskId = payload.task.id;
    } else if (payload?.id && payload?.type === 'task') {
      taskId = payload.id;
    }

    if (taskId) {
      try {
        const taskDetails = await capsuleCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/tasks/${taskId}`
        });

        return [taskDetails.body.task || taskDetails.body];
      } catch (error) {
        console.warn('Failed to fetch task details:', error);
        return [payload];
      }
    }

    return [payload];
  },
});
