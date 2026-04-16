import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { courierAuth } from '../common/auth';
import { courierApiCall } from '../common/client';

export const listMessages = createAction({
  auth: courierAuth,
  name: 'list_messages',
  displayName: 'List Messages',
  description: 'List recently sent messages with optional filters.',
  props: {
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor from a previous response.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of messages to return (default: 20, max: 100).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Opened', value: 'OPENED' },
          { label: 'Clicked', value: 'CLICKED' },
          { label: 'Bounced', value: 'BOUNCED' },
          { label: 'Undeliverable', value: 'UNDELIVERABLE' },
        ],
      },
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const queryParams: Record<string, string> = {};

    if (props.cursor) queryParams['cursor'] = props.cursor;
    if (props.limit) queryParams['limit'] = String(props.limit);
    if (props.status) queryParams['status'] = props.status;

    const response = await courierApiCall<{ paging: Record<string, unknown>; results: Record<string, unknown>[] }>({
      method: HttpMethod.GET,
      path: '/messages',
      apiKey: context.auth,
      queryParams,
    });

    return response.body;
  },
});
