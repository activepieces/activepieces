import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { twinLabsAuth } from '../..';

export const startBrowsingTask = createAction({
  name: 'startBrowsingTask',
  auth: twinLabsAuth,
  displayName: 'Browse',
  description:
    'Browse the internet with an AI web navigation agent that can find information for you',
  props: {


    startUrl: Property.ShortText({
      displayName: 'startUrl',
      required: true,
      description: 'The URL where the browsing task should begin',
      defaultValue: '',
    }),

    goal: Property.ShortText({
      displayName: 'Goal',
      required: true,
      description: 'The goal or objective of the browsing task',
    }),
  },

  async run(context) {
    interface ApiResponse {
      output: any;
      status: string;
      taskId: string;
      [key: string]: any;
    }

    // Start the browsing task
    const res = await httpClient.sendRequest<ApiResponse>({
      method: HttpMethod.POST,
      url: 'https://api.twin.so/browse',
      headers: {
        'x-api-key': context.auth,
        'Content-Type': 'application/json',
      },
      body: {
        goal: context.propsValue['goal'],
        startUrl: context.propsValue['startUrl'],
        outputType: 'string',
        completionCallbackUrl: 'https://',
      },
    });

    const taskId = res.body.taskId;
    let taskStatus = res.body.status;

    const maxTime = Date.now() + 15 * 60 * 1000; // 15 minutes timeout


    // Initialize statusResponse to store the last response
    let statusResponse: ApiResponse = res.body;

    // Poll for task completion every 5 seconds until timeout
    while (taskStatus !== 'COMPLETED' && Date.now() < maxTime) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5 seconds

      const response = await httpClient.sendRequest<ApiResponse>({
        method: HttpMethod.GET,
        url: `https://api.twin.so/task/${taskId}`,
        headers: {
          'x-api-key': context.auth,
          'Content-Type': 'application/json',
        },
      });

      statusResponse = response.body; // update statusResponse with the latest response
      taskStatus = statusResponse.status;
    }


    // Return the final statusResponse in all cases
    return statusResponse;
  },
});
