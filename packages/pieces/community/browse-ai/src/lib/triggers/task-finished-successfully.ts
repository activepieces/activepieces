import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { browseAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const taskFinishedSuccessfully = createTrigger({
  auth: browseAiAuth,
  name: 'taskFinishedSuccessfully',
  displayName: 'Task Finished Successfully',
  description: 'Triggers when a Browse AI robot task finishes successfully',
  props: {
    robotId: Property.ShortText({
      displayName: 'Robot ID',
      description: 'The ID of the robot to monitor',
      required: true,
    }),
  },
  sampleData: {
    event: 'task.finishedSuccessfully',
    task: {
      id: 'f6fb62b6-f06a-4bf7-a623-c6a35c2e70b0',
      robotId: '4f5cd7ff-6c98-4cac-8cf0-d7d0cb050b06',
      status: 'successful',
      inputParameters: {
        originUrl: 'https://www.ycombinator.com/companies/airbnb',
        companies_skip: 0,
        companies_limit: 10,
      },
      capturedLists: {
        companies: [
          {
            Position: '1',
            name: 'Airbnb',
            location: 'San Francisco, CA, USA',
            description: 'Book accommodations around the world.',
          },
        ],
      },
      capturedTexts: {
        'Product Name': 'Alexis',
        Width: '15',
      },
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
        event: 'task.finishedSuccessfully',
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
      task?: {
        status?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };

    if (
      payload.event === 'task.finishedSuccessfully' &&
      payload.task?.status === 'successful'
    ) {
      return [payload];
    }

    return [];
  },
});
