import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

const BASE_URL = 'https://api.lu.ma/public/v1';

export const listEvents = createAction({
  auth: lumaAuth,
  name: 'list_events',
  displayName: 'List Events',
  description:
    'Retrieves a list of events from your Luma calendar. [See the documentation](https://docs.lu.ma/api-reference)',
  props: {
    after: Property.ShortText({
      displayName: 'After Cursor',
      description: 'Pagination cursor for fetching next page',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of events to return (max 50)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { after, limit } = propsValue;

    const params: Record<string, string> = {};
    if (after) params['after'] = after;
    if (limit) params['limit'] = String(limit);

    const queryString = new URLSearchParams(params).toString();
    const url = queryString
      ? `${BASE_URL}/events?${queryString}`
      : `${BASE_URL}/events`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'x-luma-api-key': auth,
      },
    });

    return response.body;
  },
});
