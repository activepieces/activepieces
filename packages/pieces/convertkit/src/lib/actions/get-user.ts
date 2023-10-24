import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { subscriberId } from '../common';

export const getSubscriberById = createAction({
  auth: convertkitAuth,
  name: 'get_subscriber_by_id',
  displayName: 'Get Subscriber By Id',
  description: 'Returns data for a single subscriber',
  props: {
    subscriberId,
  },
  async run(context) {
    const { subscriberId } = context.propsValue;
    const CONVERTKIT_API_URL = 'https://api.convertkit.com/v3/subscribers/';
    const url = `${CONVERTKIT_API_URL}/${subscriberId}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
