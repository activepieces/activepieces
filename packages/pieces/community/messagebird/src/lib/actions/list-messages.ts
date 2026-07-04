import { birdAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';

export const listMessages = createAction({
  auth: birdAuth,
  name: 'listMessages',
  displayName: 'List Messages',
  description: 'Lists an Messages via Bird Channels API',
  audience: 'both',
  aiMetadata: { description: 'Retrieve messages for the configured Bird (MessageBird) channel within a required UTC start/end time window (the span must not exceed 7 days). Choose this to read recent message history or to look up message status. Set status to "all" to return messages of every status, or pick a specific status (pending, sent, delivered, failed, etc.) to filter to matching messages only; supports a page token for paging past 1000 results. Read-only and idempotent.', idempotent: true },
  props: {
    status : Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the messages to filter by (select "All" for all statuses)',
      required: true,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
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
      displayName: 'Start Date and Time',
      description: 'The start date and time (in UTC) to filter messages',
      required: true,
      defaultValue: dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm:ss[Z]'),
    }),
    endAt: Property.DateTime({
      displayName: 'End Date and Time',
      description: 'The end date and time (in UTC) to filter messages, should not exceed 7 days from start date',
      required: true,
      defaultValue: dayjs().format('YYYY-MM-DDTHH:mm:ss[Z]'),
    }),
    pageToken: Property.ShortText({
      displayName: 'Next Page Token',
      description: 'Token for pagination to fetch next set of results after 1000 messages',
      required: false,
    }),
  },
  async run(context) {
    const { status, startAt, endAt, pageToken } = context.propsValue;
  
    const auth = context.auth.props;

    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.GET,
      url: `https://api.bird.com/workspaces/${auth.workspaceId}/channels/${auth.channelId}/messages`,
      queryParams: {
        limit: '1000',
        ...(status === 'all' ? {} : { status: status }),
        startAt: startAt,
        endAt: endAt,
        ...(pageToken ? { pageToken: pageToken } : {}),
      },
      headers: {
        'Authorization': `Bearer ${auth.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body
  },
});
