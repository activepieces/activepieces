import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

const BASE_URL = 'https://api.lu.ma/public/v1';

export const getEvent = createAction({
  auth: lumaAuth,
  name: 'get_event',
  displayName: 'Get Event',
  description:
    'Retrieves event details by event ID. [See the documentation](https://docs.lu.ma/api-reference)',
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The Luma event ID to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { event_id } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/events/${encodeURIComponent(event_id)}`,
      headers: {
        'x-luma-api-key': auth,
      },
    });

    return response.body;
  },
});
