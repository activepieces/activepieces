import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../..';

const BASE_URL = 'https://api.flodesk.com/v1';

export const findSubscriber = createAction({
  auth: flodeskAuth,
  name: 'find_subscriber',
  displayName: 'Find Subscriber By Email',
  description:
    'Find a subscriber by email address in Flodesk. [See the documentation](https://developers.flodesk.com/#tag/subscriber/operation/retrieveSubscriber)',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the subscriber to find',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { email } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/subscribers`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      queryParams: {
        email,
      },
    });

    return response.body;
  },
});
