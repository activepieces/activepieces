import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../..';

const BASE_URL = 'https://api.flodesk.com/v1';

export const createOrUpdateSubscriber = createAction({
  auth: flodeskAuth,
  name: 'create_or_update_subscriber',
  displayName: 'Create or Update Subscriber',
  description:
    'Creates a new subscriber or updates an existing one in Flodesk. [See the documentation](https://developers.flodesk.com/#tag/subscriber/operation/createOrUpdateSubscriber)',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The subscriber email address',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The subscriber first name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The subscriber last name',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, first_name, last_name } = propsValue;

    const body: Record<string, unknown> = { email };
    if (first_name) body['first_name'] = first_name;
    if (last_name) body['last_name'] = last_name;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/subscribers`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
