import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../..';

const BASE_URL = 'https://api.lu.ma/public/v1';

export const createGuest = createAction({
  auth: lumaAuth,
  name: 'create_guest',
  displayName: 'Create Guest',
  description:
    'Registers a guest for an event on Luma. [See the documentation](https://docs.lu.ma/api-reference)',
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The Luma event ID to add the guest to',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Guest email address',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Guest display name',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Guest timezone (e.g., America/New_York)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { event_id, email, name, timezone } = propsValue;

    const body: Record<string, unknown> = { email };
    if (name) body['name'] = name;
    if (timezone) body['timezone'] = timezone;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/events/${encodeURIComponent(event_id)}/guests`,
      headers: {
        'x-luma-api-key': auth,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
