import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { customerioAuth } from '../../..';

export const trackEvent = createAction({
  name: 'track_event',
  auth: customerioAuth,
  displayName: 'Track Event',
  description: 'Track a custom event for a customer',
  props: {
    customer_id: Property.ShortText({ displayName: 'Customer ID', required: true }),
    event_name: Property.ShortText({ displayName: 'Event Name', required: true }),
    data: Property.Json({ displayName: 'Event Data', description: 'Optional event properties as JSON', required: false }),
  },
  async run({ auth, propsValue }) {
    const credentials = Buffer.from(`${auth.site_id}:${auth.api_key}`).toString('base64');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://track.customer.io/api/v1/customers/${encodeURIComponent(propsValue.customer_id)}/events`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: {
        name: propsValue.event_name,
        data: propsValue.data || {},
      },
    });
    return response.body;
  },
});
