import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

const BASE_URL = 'https://api.lu.ma/public/v1';

export const createEvent = createAction({
  auth: lumaAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description:
    'Creates a new event listing on Luma. [See the documentation](https://docs.lu.ma/api-reference)',
  props: {
    name: Property.ShortText({
      displayName: 'Event Name',
      description: 'The name of the event',
      required: true,
    }),
    start_at: Property.DateTime({
      displayName: 'Start Time',
      description: 'When the event starts',
      required: true,
    }),
    end_at: Property.DateTime({
      displayName: 'End Time',
      description: 'When the event ends',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone (e.g., America/New_York)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Event description (supports markdown)',
      required: false,
    }),
    geo_address_json: Property.Json({
      displayName: 'Location',
      description: 'Event location as JSON (e.g., {"city": "San Francisco", "region": "CA"})',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, start_at, end_at, timezone, description, geo_address_json } =
      propsValue;

    const body: Record<string, unknown> = { name };
    if (start_at) body['start_at'] = start_at;
    if (end_at) body['end_at'] = end_at;
    if (timezone) body['timezone'] = timezone;
    if (description) body['description'] = description;
    if (geo_address_json) body['geo_address_json'] = geo_address_json;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/events`,
      headers: {
        'x-luma-api-key': auth,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
