import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { browseAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const taskFinishedWithError = createTrigger({
  auth: browseAiAuth,
  name: 'taskFinishedWithError',
  displayName: 'Task Finished With Error',
  description: 'Triggers when a Browse AI robot task fails with an error',
  props: {
    robotId: Property.ShortText({
      displayName: 'Robot ID',
      description: 'The ID of the robot to monitor',
      required: true,
    }),
  },
  sampleData: {
    event: 'task.finishedWithError',
    task: {
      id: 'f6fb62b6-f06a-4bf7-a623-c6a35c2e70b0',
      robotId: '4f5cd7ff-6c98-4cac-8cf0-d7d0cb050b06',
      status: 'failed',
      inputParameters: {
        originUrl: 'https://www.example.com',
        search_term: 'test query',
      },
      userFriendlyError: 'Failed to process the webpage. Element not found.',
      runByUserId: null,
      robotBulkRunId: null,
      runByTaskMonitorId: null,
      runByAPI: true,
      createdAt: 1678795867879,
      startedAt: 1678795867879,
      finishedAt: 1678795867879,
      triedRecordingVideo: true,
      videoUrl: null,
      videoRemovedAt: null,
      retriedOriginalTaskId: null,
      retriedByTaskId: null,
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/webhooks',
      {
        robotId: context.propsValue.robotId,
        url: context.webhookUrl,
        event: 'task.finishedWithError',
      }
    );

    await context.store.put('webhookId', response.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhookId');
    if (webhookId) {
      await makeRequest(
        context.auth as string,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      event?: string;
      task?: { status?: string };
      [key: string]: any;
    };

    // Check if task failed with error
    if (
      payload.event === 'task.finishedWithError' &&
      payload.task?.status === 'failed'
    ) {
      return [payload];
    }

    return [];
  },
});
