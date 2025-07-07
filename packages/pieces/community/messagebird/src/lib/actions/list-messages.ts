import { birdAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const listMessages = createAction({
  auth: birdAuth,
  name: 'listMessages',
  displayName: 'List Messages',
  description: 'Lists an Messages via Bird Channels API',
  props: {
    status : Property.StaticMultiSelectDropdown({
      displayName: 'Status',
      description: 'The status of the message to be sent',
      required: true,
      options: {
        options: [
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Processing', value: 'processing' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Sent', value: 'sent' },
          { label: 'Sending Failed', value: 'sending_failed' }, 
          { label: 'Delivered', value: 'delivered' },
          { label: 'Delivery Failed', value: 'delivery_failed' },
          { label: 'Deleted', value: 'deleted' },
          { label: 'Skipped', value: 'skipped' },
        ]},
    }),
    startAt: Property.DateTime({
      displayName: 'Start At',
      description: 'The start date and time to filter messages (UTC timestamp)',
      required: true,
    }),
    endAt: Property.DateTime({
      displayName: 'End At',
      description: 'The end date and time to filter messages (UTC timestamp)',
      required: true,
    }),
  },
  async run(context) {
    const { status, startAt, endAt } = context.propsValue;
    const auth = context.auth as { apiKey: string; workspaceId: string; channelId: string };
    
    let allMessages: MessageResult[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      // Simple rate limiting - wait 20ms between requests (50 req/sec)
      await sleep(20);

      const response: ApiResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.bird.com/workspaces/${auth.workspaceId}/channels/${auth.channelId}/messages`,
        queryParams: {
          limit: '1000',
          status: status.join(','),
          startAt: startAt,
          endAt: endAt,
          ...(nextPageToken ? { pageToken: nextPageToken } : {}),
        },
        headers: {
          'Authorization': `Bearer ${auth.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.body.data.results) {
        allMessages = [...allMessages, ...response.body.data.results];
      }
      
      nextPageToken = response.body.data.nextPageToken;
    } while (nextPageToken);

    return allMessages;
  },
});

interface MessageResult {
  [key: string]: any;
}

interface ResponseData {
  results: MessageResult[];
  nextPageToken?: string;
}

interface ApiResponse {
  body: {
    data: ResponseData;
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
