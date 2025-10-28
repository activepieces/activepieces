import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { twinLabsAuth } from '../..';

// API BASE URL
const API_BASE_URL = 'https://paris.prod.api.twin.so';

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
    // Interface for the initial /browse
    interface BrowseStartResponse  {
      url: string;
      universeId: string;
      worldId: number;
      unitId: number;
    }

    // Interface for the GET polling
    interface BrowseStatusResponse {
      completed : boolean;
      pending?: boolean;
      output?: string;
      
    }

    // Start the browsing task
    const startRes  = await httpClient.sendRequest<BrowseStartResponse>({
      method: HttpMethod.POST,
      url: `${API_BASE_URL}/browse`,
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

    const pollingUrl = startRes.body.url;
    let statusResponse: BrowseStatusResponse  = { 
      completed: false,
      pending: true,
     };
    const timeoutAt = Date.now() + 15 * 60 * 1000; // 15 minutes


    // Poll for task completion every 5 seconds until timeout
    while (!statusResponse.completed && Date.now() < timeoutAt) {
      await new Promise((resolve) => setTimeout(resolve, 5_000)); // wait 5 seconds

      const pollRes  = await httpClient.sendRequest<BrowseStatusResponse>({
        method: HttpMethod.GET,
        url: pollingUrl,
        headers: {
          'x-api-key': context.auth,
          'Content-Type': 'application/json',
        },
      });

      statusResponse = pollRes.body; // update statusResponse with the latest response
      
    }


    // Return the final statusResponse in all cases
    return statusResponse;
  },
});
